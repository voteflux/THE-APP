import logging
logging.basicConfig(level=logging.INFO)
logging.warning("logging started")
import json
import sys
sys.path.insert(0, '/opt')
sys.path.insert(0, '../deps')


from attrdict import AttrDict

from lib import *

def qanda(event, ctx):
    _e = AttrDict(event)
    path_tail = _e.resource.rsplit("/", 1)[1]
    data = json.loads(_e.body)

    ret = {
        'getMine': lambda: get_mine(data),
        'get': lambda: get_all(data),
        'submit': lambda: submit(data)
    }[path_tail]()

    # ret = {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*"}, 'body': {'questions': []}}
    logging.info(f"[INFO] Returning {ret}")
    print(f"Returning {ret}")
    return ret
