import logging


class CmdRunner:
    def __init__(self, cmd_runner):
        self.cmds = []
        self.cmd_runner = cmd_runner

    def add(self, name, cmd, silent_exception=False):
        self.cmds.append((name, cmd, silent_exception))

    def run(self, cmd_runner=None):
        cmd_runner = self.cmd_runner if cmd_runner is None else cmd_runner
        for (n, cmd, silent_exception) in self.cmds:
            logging.info("Running ({name}) as cmd:\n\t{cmd}\n".format(name=n, cmd=cmd))
            cmd_runner(cmd, silent_exception=silent_exception)
