import logging
logging.basicConfig(level=logging.INFO)
logging.warning("logging started")
import json
import sys
sys.path.insert(0, '/opt')
sys.path.insert(0, './deps')

print("altered path")

from attrdict import AttrDict
import lib


def ensure_cors(ret):
    if 'headers' not in ret:
        ret['headers'] = dict()
    ret['headers'].update({
        'access-control-allow-headers': "'*'",
        'access-control-allow-methods': "'GET,POST,OPTIONS'",
        'access-control-allow-origin': "'*'"
    })


def qanda(event, ctx):
    _e = AttrDict(event)
    path_tail = _e.resource.rsplit("/", 1)[1]
    print(f"About to call {path_tail}")

    ret = {
        'getMine': lambda: lib.get_mine(json.loads(_e.get('body', '{}'))),
        'get': lambda: lib.get_all(),
        'submit': lambda: lib.submit(json.loads(_e.get('body', '{}')))
    }[path_tail]()

    # ret = {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*"}, 'body': {'questions': []}}
    ensure_cors(ret)
    logging.info(f"[INFO] Returning {ret}")
    print(f"Returning {ret}")
    return ret
