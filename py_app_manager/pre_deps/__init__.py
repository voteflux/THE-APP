import os, logging, sys, subprocess
import time

mgr_setup_flag_file = "./.dev_app_init_last"

def must_run(cmd, graceful_exit=True):
    logging.info("Running `%s`" % cmd)
    exit_code = os.system(cmd)
    logging.debug("Command `%s` exited w code %d" % (cmd, exit_code))
    if exit_code != 0:
        logging.error("Failed to run %s" % cmd)
        if graceful_exit:
            sys.exit(1)
        else:
            raise Exception("Failed to run required cmd: %s" % cmd)

def run_or(cmd, error_msg, verbose=False):
    exit_code = os.system(cmd)
    if exit_code != 0:
        if verbose:
            logging.error("Running %s failed with exit code %d" % (cmd, exit_code))
        logging.error(error_msg)
        raise Exception("Failed to run required cmd: %s" % cmd)

def cmd_w_log(cmd, log_name, dir_offset="./"):
    assert dir_offset[-1] == "/"
    fname = """.flux-dev.{l}.log""".format(l=log_name)
    fpath = '{d}{f}'.format(d=dir_offset, f=fname)
    return (('mv {p} {p}.previous || true && ' + cmd + ''' 2>&1 | tee "{p}" ''').format(p=fpath), fname)

def get_git_head():
    try:
        return subprocess.check_output(['git', 'rev-parse', 'HEAD'])
    except:
        return b"FAKE-HEAD"

def deps_up_to_date():
    if not os.path.isfile(mgr_setup_flag_file):
        logging.debug("deps up to date false no file")
        return False
    with open(mgr_setup_flag_file, 'rb') as f:
        up_to_date = f.read() == get_git_head()
        if not up_to_date:
            logging.debug("deps up to date false git mismatch")
        return up_to_date

def set_deps_up_to_date():
    with open(mgr_setup_flag_file, 'wb') as f:
        f.write(get_git_head())

def confirm(prompt, default_continue=False):
    answer = None
    yes = {'y', 'yes'}
    no = {'n', 'no'}
    valid = yes + no + {''}
    while str(answer).lower() not in (valid):
        if answer is not None:
            print("Please enter a valid input: (default %s) %s" % ('y' if default_continue else 'n', valid))
        answer = input(prompt + " [%s,%s] " % (('Y', 'n') if default_continue else ('y', 'N')))
    return (answer.lower() in yes or (default_continue and answer == ''))

# VIRTUAL ENV STUFF ---- DEPRECATED

# def activate_venv():
#     must_run("source .venv/bin/activate")

# def ensure_venv():
#     try:
#         must_run("which virtualenv >/dev/null 2>&1")
#     except:
#         run_or("pip3 install virtualenv", "unable to setup virtualenv; failing", verbose=True)
#     if not os.path.isdir(".venv"):
#         must_run("virtualenv -p python3 .venv")
#     activate_venv()
