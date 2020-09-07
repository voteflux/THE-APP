import json
import logging
import time

logging.basicConfig(level=logging.INFO)
logging.warning("logging started")


def ensure_cors(ret):
    headers = ret.setdefault('headers', {})
    headers.update({
        'access-control-allow-headers': "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
        'access-control-allow-methods': "GET,POST,OPTIONS",
        'access-control-allow-origin': "*"
    })
    return ret


def cors(event, ctx):
    return ensure_cors({'statusCode': 200, 'body': 'cors-response'})


def ping(event, ctx):
    return ensure_cors({'statusCode': 200, 'body': json.dumps(dict(pong=time.time()))})
