import asyncio

import flux.db as db
from flux.exceptions import LambdaError


def gen_status(status, body=None, headers=None):
    ret = {
        'statusCode': status,
        'headers': {
            'content-type': 'application/json',
            'access-control-allow-headers': "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent,Referer",
            'access-control-allow-methods': "GET,POST,OPTIONS",
            'access-control-allow-origin': "*"
        }
    }
    ret.update({'body': body} if body is not None else {})
    ret['headers'].update(headers if headers is not None else {})
    return ret


def err(msg):
    return {'error': msg}


def success(body):
    return gen_status(200, body)


def auth(f):
    async def inner(event, ctx, *args, **kwargs):
        async def inner2():
            data = event['body']
            user = await db.find_user(data)
            if user is not None:
                print("got user", user['_id'])
            event.update({'s': '*************'})
            if user is not None:
                return await f(event, ctx, user, *args, **kwargs)
            print("user failed auth")
            raise LambdaError(403, "Unauthorized")
        try:
            # loop = asyncio.get_event_loop()
            # ret = loop.run_until_complete(inner2())
            # print(f"auth-inner got good return: {ret}")
            return await inner2()
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"[ERROR]: {repr(e)} {str(e)}, {type(e)}")
        raise LambdaError(403, "Unauthorized")
    return inner

