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
    path_tail = _e.resource.split("/")[2]
    print(f"About to call {path_tail}, {_e.pathParameters}")
    print(_e)

    get_handlers = {
        'get': handlers.get_all,
        'question': handlers.get_question,
        'replyIds': handlers.get_reply_ids,
        'reply': handlers.get_reply,
    }
    post_handlers = {
        'getMine': handlers.get_mine,
        'submit': handlers.submit,
        'submitReply': handlers.submit_reply,
    }

    ret = {
        'GET': get_handlers,
        'POST': post_handlers,
    }[_e.httpMethod.upper()][path_tail](_e, ctx)

    # ensure_cors(ret)
    logging.info(f"[INFO] Returning {ret}")
    print(f"Returning {ret}")
    return ret
