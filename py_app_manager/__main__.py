''' Run ./manage from repo root to use the management console
'''

import sys, os, json, logging, subprocess

logging.basicConfig(level=logging.INFO)

from time import sleep
from contextlib import suppress
from collections import defaultdict

try:
    from git import Repo
except ImportError as e:
    Repo = None
repo = None

from py_app_manager.pre_deps import *
from py_app_manager.cmd_runner import CmdRunner


WSL = os.path.exists('/bin/wslpath')
pwd_cmd = "wslpath -w $(pwd)" if WSL else "pwd"


def is_netlify():
    return 'IS_NETLIFY' in os.environ


def _sam_pip():
    dir_offset = f'packages/api/sam-app'
    func_dirs = map(lambda x: f'{dir_offset}/funcs/{x}', os.listdir(f'{dir_offset}/funcs'))
    targets = [f'{dir_offset}/libs'] + [p for p in func_dirs if os.path.exists(f'{p}/requirements.txt')]
    runner = CmdRunner(must_run)
    pip_install = 'pip3 install -t deps -r requirements.txt --upgrade'
    for t in targets:
        runner.add(f'Installing python deps for {t}/requirements.txt in {t}/deps',
                   f'cd {t} && docker run --rm -v $({pwd_cmd}):/var/task lambci/lambda:build-python3.7 {pip_install}')
    runner.run()


_deps_updated = False


def ensure_python_deps(force=False):
    global _deps_updated, repo
    if force or (not deps_up_to_date() and not _deps_updated):
        must_run("python3 -m pip install -r requirements.txt")



def ensure_deps(force=False):
    global _deps_updated, repo
    if force or (not deps_up_to_date() and not _deps_updated):
        def install_deps():
            must_run("python3 -m pip install -r requirements.txt")
            must_run("npm i")
            # seems like --scope breaks things, works fine without it, but only finds one package when passed {lib,ui}
            # 2020-09-08
            # if bootstrap_only is not None:
            #     scope = "{" + ','.join(bootstrap_only) + "}"
            #     must_run(f"npx lerna bootstrap --scope {scope}")
            # else:
            #    must_run("npx lerna bootstrap")
            must_run("npx lerna bootstrap")
            if not is_netlify():
                _sam_pip()
            set_deps_up_to_date()

        if Repo is not None:
            repo = Repo('./')
            if repo.is_dirty() and not force and not is_netlify():
                logging.warning("⚠️ Repository is dirty; skipping reinstall of requirements!")
            else:
                logging.warning("⚠️ Detected repository but not dirty; installing requirements!")
                install_deps()
        else:
            install_deps()
        _deps_updated = True and not force


def export(env_name, env_value):
    if env_value is not None:
        os.environ[env_name] = env_value
    else:
        logging.warning(f"Not exporting {env_name} b/c value is None")


# check we're in the correct directory
try:
    with open('package.json', 'r') as f:
        pkg_file = json.load(f)
    assert pkg_file['name'] == "root"
    assert os.path.isdir("./packages/api")
    assert os.path.isdir("./packages/lib")
    assert os.path.isdir("./packages/ui")
except Exception as e:
    print(f"Please run ./manage from the root directory (of the repository) -- Exception: {e}")
    sys.exit(255)

skip_ensure_deps = len(sys.argv) > 1 and (
            sys.argv[1] == "mgr_set_up_to_date"
            or False
)
_deps_updated = skip_ensure_deps

# ensure deps and things are installed before we go further
try:
    ensure_python_deps()
except Exception as e:
    print("unable to install dependencies; exiting")
    print(e, e.args)
    raise e

# main UI

import boto3
from attrdict import AttrDict
import click


def stage_option(*args, required=True):
    def inner_stage_option(_f):
        return click.option('--stage', type=click.Choice(['prod', 'staging', 'dev']),
                            **(dict(default='dev') if required else dict(required=False)))(_f)

    if len(args) == 1 and callable(args[0]):
        return inner_stage_option(args[0])
    return inner_stage_option


type_pkg_choice = click.Choice(['api', 'ui', 'lib', 'all'])

def render_target(target):
    return {'all': '', 'lib': 'flux-lib'}.get(target, target)


@click.group()
@click.option("--debug/--no-debug", default=False)
def cli(debug):
    if debug:
        logging.basicConfig(level=logging.DEBUG)
        logging.debug("Debug mode enabled")


@cli.command()
def reinstall():
    must_run('npx lerna clean -y')
    must_run('rm -r node_modules')
    ensure_deps(force=True)


@cli.command()
def clean():
    # clean up any temporary / boring files
    cmds = [
        "rm -rf ./.flux-dev.*.log*",
        # "npx lerna clean -y || true",
        # "npx lerna exec -- npm cache clean --force || true",
        "rm -rf node_modules",
        "rm -rf packages/*/node_modules"
    ]
    logging.debug("Cleaning up...")
    for cmd in cmds:
        logging.debug("Running %s" % cmd)
        must_run(cmd)
    logging.debug("Done cleaning up.")


@cli.command()
def lerna_upgrade():
    runner = CmdRunner(must_run)
    runner.add('upgrade lerna', 'npm upgrade')
    runner.add('upgarde packages', 'npx lerna exec --no-bail -- npm upgrade')
    runner.add('clean and bootstrap', 'npx lerna clean -y && npx lerna bootstrap')
    runner.run()


@cli.command()
@click.argument('pkgs', nargs=-1)
@click.pass_context
def mgr_add_dep(ctx, pkgs):
    logging.debug("Packages to install: %s" % list(pkgs))
    if len(pkgs) == 0:
        logging.error("No packages supplied to install. Exiting.")
        sys.exit(1)
    run_or("python3 -m pip install %s" % (' '.join(pkgs) or '',), 'Unable to install packages: %s' % (pkgs,))
    logging.info("Installed packages: %s" % list(pkgs))
    must_run("python3 -m pip freeze > requirements.txt")
    logging.info("Saved `requirements.txt`")


@cli.command()
def mgr_set_up_to_date():
    set_deps_up_to_date()


def install_npm_deps(target, deps, dev=False):
    logging.warning("⚠️ dependencies will be installed one at a time. (It's a lerna thing)")
    runner = CmdRunner(must_run)
    scope = render_target(target)
    lerna_pkg = '' if scope == '' else '--scope={}'.format(scope)
    dev_flag = "--dev" if dev else ""
    for d in deps:
        runner.add('Installing node dependency `{d}` for `{pkg}`'.format(d=d, pkg=target),
                   'npx lerna add {d} {pkg} {dev}'.format(d=d, pkg=lerna_pkg, dev=dev_flag))
    runner.run()


@cli.command()
@click.argument('target', nargs=1, type=type_pkg_choice)  # help='Package to add dependency to',
@click.argument('dependencies', nargs=-1)  # help='NPM packages to add as dependencies'
@click.option('--dev', default=False, type=bool, help="Install as devDependency")
def addto(target, dependencies, dev):
    install_npm_deps(target, dependencies, dev)


@cli.command()
@click.argument('dependencies', nargs=-1)  # help='NPM packages to add as dependencies'
@click.option('--dev', default=False, type=bool, help="Install as devDependency")
def add(dependencies, dev):
    install_npm_deps('all', dependencies, dev)


@cli.command()
def sam_pip():
    _sam_pip()


@cli.command()
@stage_option
@click.argument('target', nargs=1, type=click.Choice(['api', 'ui', 'all']))
@click.argument('args', nargs=-1)
def test(stage, target, args):
    export("STAGE", stage)
    runner = CmdRunner(must_run)
    if target in {'api', 'all'}:
        runner.add('api tests',
                   'cd packages/api && npm run test -- --stage {s} {args}'.format(s=stage, args=' '.join(args)))
    runner.run()


DO_CDK_FROM_SAM = f"cd cdk && " \
                  f"echo '# Autogenerated!' > ../template.yaml && " \
                  f"cdk synth >> ../template.yaml && cd .."


@cli.command()
@stage_option
@click.option('--skip-tests', default=False, is_flag=True, type=click.BOOL)
@click.option('--quick-sam', default=False, is_flag=True, type=click.BOOL)
@click.argument('target', nargs=1, type=click.Choice(['api', 'sam']))
@click.argument('args', nargs=-1)
def deploy(stage, skip_tests, quick_sam, target, args):
    runner = CmdRunner(must_run)
    if target in {'api', 'all'}:
        runner.add('api', "cd packages/api && npm run deploy -- --stage {} {args}".format(stage, args=' '.join(args)))
    if target in {'sam'}:
        params = AttrDict(json.load(open(f'packages/api/sam-app/parameters.{stage}.json', 'r')))
        params.pStage = stage
        params_str = ' '.join([f'\"{k}={v}\"' for k, v in params.items()])
        bucket = f'{params.pNamePrefix}-sam-cf-artifacts'
        stack_name = {
            'prod': 'flux-sam-app',
            'staging': 'flux-sam-app-dev',
            'dev': 'flux-api-local-dev'
        }[stage]
        tmp_file = f'tmp-{stage}-out.yaml'
        sam_build = f"sam build -b .aws-sam-{stage} && " if not quick_sam else ""
        sam_pre = f"rm -rf {tmp_file} || true && " \
                  f"{DO_CDK_FROM_SAM} && " \
                  f"aws s3 mb s3://{bucket} && echo 'created bucket {bucket}' || echo 'bucket {bucket} not created' && "
        runner.add('sam', f"set -x && set -e && cd packages/api/sam-app && "
                          f"{sam_pre} "
                          f"{sam_build} "
                          f"sam validate && "
                          f"sam package --s3-bucket {bucket} --output-template-file {tmp_file} && "
                          f"sam deploy --template-file {tmp_file} "
                          f"--stack-name {stack_name} "
                          f"--parameter-overrides {params_str} "
                          f"--capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND --no-fail-on-empty-changeset")
    runner.run()


@cli.command()
def manual_deploy_ui():
    runner = CmdRunner(must_run)
    runner.add("ui", "netlify deploy --prod --site app.flux.party")


@cli.command()
@click.argument('target', nargs=1, type=click.Choice(['ui', 'api', 'sam', 'all']))
@click.argument('build_args', nargs=-1, type=click.STRING)
@stage_option(required=False)
def build(target, build_args, stage):
    export("STAGE", stage)
    logging.info("Building {} for {}".format(target, stage))
    rem_args = " ".join(build_args)

    if target in {'ui', 'api', 'all'}:
        ensure_deps(force=True)

    try:
        if stage == "prod":
            logging.info("Building for prod!")
            # note: this won't trigger normally due to an early exit from ./manage
            if is_netlify():
                logging.info("Checking out most recent version tag")
                # reset_checkout_ref = os.environ.get('BRANCH', 'master')
                real_checkout_tag = os.environ['MOST_RECENT_TAG']
                must_run("git checkout {}".format(real_checkout_tag))
            else:
                logging.info("Not on netlify - will not checkout most recent git tag")

        def build_ui():
            logging.info("### BUILDING UI ###")
            must_run(f"cd packages/ui && npm run build -- {rem_args}")

        def build_api():
            logging.info("### BUILDING API ###")
            stage_args = "" if stage is None else f"--stage {stage}"
            must_run(f"cd packages/api && npm run build -- {stage_args} {rem_args}")

        def build_sam():
            logging.info("### BUILDING SAM API ###")
            stage_args = "" if stage is None else f"-b .aws-sam-{stage}"
            must_run(f"cd packages/api/sam-app && {DO_CDK_FROM_SAM} && sam build {stage_args} {rem_args}")

        def build_all():
            build_ui()
            build_api()

        return ({
            'ui': build_ui,
            'api': build_api,
            'all': build_all,
            'sam': build_sam
        }[target])()
    finally:
        pass


@cli.command()
@click.argument('dev_target', type=click.Choice(['ui', 'ui-static', 'api', 'sam', 'all']))
@stage_option
def dev(dev_target, stage):
    # # first check dynamodb install
    # if dev_target in {'api', 'all'}:
    #     # we need to ensure dynamodb is installed for API dev (note: currently not _actually_ required for anything... -- 9/9/2018)
    #     must_run("cd packages/api && node_modules/.bin/sls dynamodb install")

    # `--stage` has special meaning with dev cmd (emulates a stage via api points (UI))
    os.environ["STAGE"] = "dev"

    import libtmux
    api_port = 52700
    sam_port = 52701
    ui_port = 52710
    ui_static_port = 52711
    TMP_SESSION = 'tmp-session'
    sess_name = f"dev-{int(time.time())}"
    server = libtmux.Server(socket_name='flux-app-tmux-session')
    # server.cmd('set -g destroy-unattached off')
    server.cmd('set-option -g default-shell /bin/bash')
    session = server.new_session(session_name=sess_name, start_directory='./', window_command="sleep 1")
    session.set_option('mouse', True)

    # session.set_option('destroy-unattached', 'off')
    # session.set_option('remain-on-exit', 'on')

    def kill_sessions():
        with suppress(Exception):
            try:
                for s in server.list_sessions():
                    print(s)
                    print(s.show_option('default-shell'))
                    s.kill_session()
            except Exception as e:
                if "no server running on" not in f"{e}":
                    print('got an exception killing tmux sessions:', e)

    # kill_sessions()
    # session = None
    # window = None
    window = session.list_windows()[0]
    print(session.list_windows())
    log_files = []

    def run_dev_cmd(dir, cmd, name, active_pane=None, vertical=False, wsl=False):
        nonlocal session, window, log_files
        if not wsl:
            (to_run, l) = cmd_w_log(cmd, name, dir_offset='../../')
            log_files.append(l)
        if wsl:
            # to_run = cmd.replace('"', '\\"')
            # to_run = f'powershell.exe -Command "\$Env:AWS_PROFILE = \'$AWS_PROFILE\' ; {to_run}"'
            to_run = cmd
        # to_run = "printf '\\033]2;\%s\\033\\' '{title}'; _r(){{ if [ -e /usr/bin/read ]; then /usr/bin/read \"$@\"; else read \"$@\"; fi }}; endsess(){{ _r -p 'Press enter to terminate all...' && tmux kill-session -t main; }} ; trap 'endsess' SIGINT SIGTERM; ".format(title=name) + to_run
        trap_cmd = "trap 'endsess' SIGTERM"
        to_run = f"printf '\\033]2;\%s\\033\\' '{name}'; " \
            f"endsess(){{ tmux kill-session -t {sess_name} || true; }} ; {trap_cmd}; " \
            f"while sleep 1; " \
            f"do {to_run}; " \
            "echo -e '\\n\\nrestarting in 1s...'; done || endsess"
        logging.debug('Running `{}` as cmd `{}`'.format(name, to_run))
        if session is None:
            session = server.new_session(session_name=sess_name, start_directory=dir, window_command=to_run)
            # session.set_option('remain-on-exit', 'on')
            window = session.list_windows()[0]
            return window.attached_pane
        else:
            return window.split_window(start_directory=dir, shell=to_run, vertical=vertical)

    # uncomment the below if we need to compile flux-lib
    # lib_pane = run_dev_cmd('./packages/lib', 'npm run watch', 'dev-lib')
    if dev_target in {'ui', 'all'}:
        ui_pane = run_dev_cmd('./packages/ui', "STAGE={} npm run serve".format(stage), 'dev-ui')

    if dev_target in {'ui-static', 'all'}:
        ui_static_pane = run_dev_cmd('./packages/ui', f"STAGE={stage} npm run static:serve", 'dev-ui-static')

    if dev_target in {'api', 'all'}:
        # mongo dev server port: 53799
        mongo_pane = run_dev_cmd('./packages/api', 'npm run mongo-dev', "mongo-dev", vertical=False)
        api_cmd = "npm run watch -- --stage dev --port %d" % (api_port,)
        api_pane = run_dev_cmd('./packages/api', api_cmd, "dev-api", vertical=True, active_pane=mongo_pane)
        # don't need to run tsc on the api atm
        # compile_pane = run_dev_cmd('./packages/api', 'npm run watch:build', 'api-watch', vertical=True)

    if dev_target in {'sam', 'all'}:
        # sam_cmd = f"C:\\Users\\Max\\AppData\\Local\\Programs\\Python\\Python36\\Scripts\\sam.exe local start-api --port {sam_port}"
        env_file = "env.json"
        # envs = json.load(open(f"./packages/api/sam-app/{env_file}", 'r'))
        # --skip-pull-image
        # --docker-volume-basedir \"$({pwd_cmd})\"
        sam_cmd = f"sam local start-api --port {sam_port} --env-vars {env_file} " \
            f"--host $(hostname) " \
            f"--parameter-overrides ParameterKey=pNamePrefix,ParameterValue=flux-api-local-dev"
        logging.info(f"sam_cmd: {sam_cmd}")
        sam_pane = run_dev_cmd('./packages/api/sam-app', sam_cmd, "sam-api", vertical=False, wsl=True)
        if stage == "dev":
            # https://github.com/tartley/rerun2
            sam_build_w_pane = run_dev_cmd('./packages/api/sam-app', '../../../py_app_manager/rerun2 sam build', 'sam-build-w', vertical=False)

            # sam_build_w_pane = run_dev_cmd('./packages/api/sam-app', 'sam build', 'sam-build-w', vertical=False)
            # dynalite_pane = run_dev_cmd(f'npx dynalite --port 8000')

    window.select_layout('tiled')

    session.attach_session()
    kill_sessions()
    logging.debug("Log files: {}".format(', '.join(log_files)))


# monkey patch so usage output looks nicer
sys.argv[0] = './manage'
cli()
