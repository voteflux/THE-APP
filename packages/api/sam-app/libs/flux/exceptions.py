

class LambdaError(Exception):
    def __init__(self, code=500, msg="Error"):
        self.code = code
        self.msg = msg
        super().__init__(f"LambdaError ({code}, {msg})")

