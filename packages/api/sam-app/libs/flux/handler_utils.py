import json

from attrdict import AttrDict
from lambda_decorators import async_handler, dump_json_body, load_json_body, LambdaDecorator, after

from .exceptions import LambdaError
from .auth import auth


class attrdict_body(LambdaDecorator):
    def before(self, event, context):
        event.update({'body': AttrDict(event['body'])})
        return event, context


class default_good_unless_exception(LambdaDecorator):
    def after(self, retval):
        if 'statusCode' not in retval:
            return {'body': retval, 'statusCode': 200}
        return retval

    def on_exception(self, exception):
        if type(exception) is LambdaError:
            return {'statusCode': exception.code, 'body': exception.msg}
        raise exception


@after
def cors_headers(retval: dict):
    headers = retval.setdefault('headers', {})
    headers.update({
        'access-control-allow-headers': "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
        'access-control-allow-methods': "GET,POST,OPTIONS",
        'access-control-allow-origin': "*"
    })
    retval['headers'] = headers
    return retval


def all_common(f):
    return cors_headers(dump_json_body(default_good_unless_exception(f)))


# note: async_handler should be last in chain (i.e. all async functions after)
def get_common(f):
    return all_common(async_handler(f))


# note: async_handler should be last in chain (i.e. all async functions after)
def post_common(f):
    return all_common(load_json_body(attrdict_body(async_handler(f))))


def auth_common(f):
    # note auth() must return an async function here
    return post_common(auth(f))


