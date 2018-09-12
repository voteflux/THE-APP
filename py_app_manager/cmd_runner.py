import logging

class CmdRunner:
    def __init__(self, cmd_runner):
        self.cmds = []
        self.cmd_runner = cmd_runner
    def add(self, name, cmd):
        self.cmds.append((name, cmd))
    def run(self, cmd_runner=None):
        cmd_runner = self.cmd_runner if cmd_runner is None else cmd_runner
        for (n, cmd) in self.cmds:
            logging.info("Running ({name}) as cmd:\n\t{cmd}\n".format(name=n, cmd=cmd))
            cmd_runner(cmd)
