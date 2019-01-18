import logging
logging.basicConfig(level=logging.INFO)
logging.warning("logging started")
import json
import sys
sys.path.insert(0, '/opt')
sys.path.insert(0, './deps')

print("altered path")

from attrdict import AttrDict

def qanda(event, ctx):
    _e = AttrDict(event)
    path_tail = _e.resource.rsplit("/", 1)[1]
    print(f"About to call {path_tail}")

    import lib
    ret = {
        'getMine': lambda: lib.get_mine(json.loads(_e.body)),
        'get': lambda: lib.get_all(),
        'submit': lambda: lib.submit(json.loads(_e.body))
    }[path_tail]()

    # ret = {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*"}, 'body': {'questions': []}}
    logging.info(f"[INFO] Returning {ret}")
    print(f"Returning {ret}")
    return ret
