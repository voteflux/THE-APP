''' Run ./manage from repo root to use the management console
'''

import sys, os, json, logging, subprocess
logging.basicConfig(level=logging.INFO)

from contextlib import suppress
from git import Repo

from py_app_manager.pre_deps import *


_deps_updated = False
def ensure_deps(force=False):
    global _deps_updated
    if (force or not deps_up_to_date()) and not _deps_updated:
        if Repo('./').is_dirty():
            logging.warning("⚠️ Repository is dirty; skipping reinstall of requirements!")
        else:
            must_run("time pip3 install -r requirements.txt")
            must_run("time npm i")
            must_run("time npx lerna bootstrap")
            must_run("cd packages/api && time node_modules/.bin/sls dynamodb install")
            set_deps_up_to_date()
        _deps_updated = True


# check we're in the correct directory
try:
    with open('package.json', 'r') as f:
        pkg_file = json.load(f)
        assert pkg_file['name'] == "root"
        assert os.path.isdir("./packages/api")
        assert os.path.isdir("./packages/lib")
        assert os.path.isdir("./packages/ui")
except Exception as e:
    print("Please run ./manage from the root directory (of the repository)")
    sys.exit(1)


skip_ensure_deps = len(sys.argv) > 1 and ( \
        sys.argv[1] == "mgr_set_up_to_date" \
        or False
    )
_deps_updated = skip_ensure_deps


# ensure deps and things are installed before we go further
try:
    # ensure_venv()
    ensure_deps()
except Exception as e:
    print("unable to install dependencies; exiting")
    print(e, e.args, e.message)
    sys.exit(1)


# main UI


import click


@click.group()
@click.option("--debug/--no-debug", default=False)
def cli(debug):
    if debug:
        logging.basicConfig(level=logging.DEBUG)
        logging.debug("Debug mode enabled")


@cli.command()
def reinstall():
    ensure_deps(force=True)


@cli.command()
def clean():
    # clean up any temporary / boring files
    cmds = [
        "rm -rf ./.flux-dev.*.log*"
    ]
    logging.debug("Cleaning up...")
    for cmd in cmds:
        logging.debug("Running %s" % cmd)
        must_run(cmd)
    logging.debug("Done cleaning up.")


@cli.command()
@click.argument('pkgs', nargs=-1)
@click.pass_context
def mgr_add_dep(ctx, pkgs):
    logging.debug("Packages to install: %s" % list(pkgs))
    if len(pkgs) == 0:
        logging.error("No packages supplied to install. Exiting.")
        sys.exit(1)
    run_or("pip3 install %s" % (' '.join(pkgs) or '',), 'Unable to install packages: %s' % (pkgs,))
    logging.info("Installed packages: %s" % list(pkgs))
    must_run("pip3 freeze > requirements.txt")
    logging.info("Saved `requirements.txt`")


@cli.command()
def mgr_set_up_to_date():
    set_deps_up_to_date()


@cli.command()
@click.option('--stage', default="dev")
@click.argument('args', nargs=-1)
def deploy_api(stage, args):
    must_run("cd packages/api && node_modules/.bin/sls deploy --stage %s %s" % (stage,' '.join(list(args))))


@cli.command()
@click.option('--env', type=click.Choice(['prod', 'staging', 'dev']), default='dev')
@click.argument('dev_target', type=click.Choice(['ui', 'api', 'all']))
def dev(env, dev_target):
    import libtmux
    api_port = 52700
    ui_port = 32710
    server = libtmux.Server(socket_name='flux-app-tmux-session')

    def kill_sessions():
        with suppress(Exception):
            for s in server.list_sessions():
                s.kill_session()

    kill_sessions()
    session = None
    window = None
    log_files = []

    def run_dev_cmd(dir, cmd, name, active_pane=None, vertical=False):
        nonlocal session, window, log_files
        (to_run, l) = cmd_w_log(cmd, name, dir_offset='../../')
        to_run += "; echo -e '\\n\\n' && /usr/bin/read -p 'Press enter to terminate all...' && tmux kill-session -t main"
        log_files.append(l)
        if session is None:
            session = server.new_session(session_name="main", start_directory=dir, window_command=to_run)
            session.set_option('mouse', 'on')
            # session.set_option('remain-on-exit', 'on')
            window = session.list_windows()[0]
            return window.attached_pane
        else:
            opts = {} if active_pane is None else {'target': active_pane.id}
            return window.split_window(start_directory=dir, shell=to_run, vertical=vertical, **opts)

    lib_pane = run_dev_cmd('./packages/lib', 'npm run watch', 'dev-lib')
    if dev_target in {'ui', 'all'}:
        ui_pane = run_dev_cmd('./packages/ui', "npm run serve", 'dev-ui')

    if dev_target in {'api', 'all'}:
        # mongo dev server port: 53799
        mongo_pane = run_dev_cmd('./packages/api', 'npm run mongo-dev', "mongo-dev", vertical=False)
        api_cmd = "node_modules/.bin/sls offline start --stage dev --port %d" % (api_port,)
        api_pane = run_dev_cmd('./packages/api', api_cmd, "dev-api", vertical=True, active_pane=mongo_pane)
        compile_pane = run_dev_cmd('./packages/api', 'npm run watch:build', 'api-watch', vertical=True)
        # mongo_pane.set_height(20)

    session.attach_session()
    kill_sessions()
    print("Log files: ", ', '.join(log_files))


# monkey patch so usage output looks nicer
sys.argv[0] = './manage'
cli()
