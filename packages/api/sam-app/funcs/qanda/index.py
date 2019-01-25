import logging
logging.basicConfig(level=logging.INFO)
logging.warning("logging started")
import json
import sys
sys.path.insert(0, '/opt')
sys.path.insert(0, './deps')

from attrdict import AttrDict
import handlers


def qanda(event, ctx):
    _e = AttrDict(event)
    path_tail = _e.resource.rsplit("/", 1)[1]
    print(f"About to call {path_tail}")

    ret = {
        'getMine': handlers.get_mine,
        'get': handlers.get_all,
        'submit': handlers.submit
    }[path_tail](event, ctx)

    # ensure_cors(ret)
    logging.info(f"[INFO] Returning {ret}")
    print(f"Returning {ret}")
    return ret
