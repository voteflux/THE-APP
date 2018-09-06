''' Run ./manage from repo root to use the management console
'''

import sys, os, json, logging, subprocess

from py_app_manager.pre_deps import *

def ensure_deps():
    if not deps_up_to_date():
        must_run("pip3 install -r requirements.txt")
        # must_run("npm i")
        # must_run("./node_modules/.bin/lerna bootstrap --hoist")
        set_deps_up_to_date()


# check we're in the correct directory
try:
    with open('package.json', 'r') as f:
        pkg_file = json.load(f)
        assert pkg_file['name'] == "root"
        assert os.path.isdir("./packages/api")
        assert os.path.isdir("./packages/lib")
        assert os.path.isdir("./packages/members.flux.party")
except Exception as e:
    print("Please run ./manage from the root directory (of the repository)")
    sys.exit(1)

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
    logging.basicConfig(level=logging.INFO)
    if debug:
        logging.basicConfig(level=logging.DEBUG)
        logging.debug("Debug mode enabled")

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
@click.option('--stage', default="dev")
@click.argument('args', nargs=-1)
def deploy_api(stage, args):
    must_run("cd packages/api && node_modules/.bin/sls deploy --stage %s %s" % (stage,' '.join(list(args))))

# monkey patch so usage string looks nicer
sys.argv[0] = './manage'
cli()
