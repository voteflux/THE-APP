import asyncio
import binascii
import logging
import os
import time
from typing import NamedTuple, Optional, TypeVar, Generic, Callable, Coroutine, Any

import boto3
import pymonad
from attrdict import AttrDict
from bson import ObjectId
from flask import request
import pymonad.either

import flux.db as db
from flux import env
from flux.exceptions import LambdaError


ssm = boto3.client('ssm')
ssm_jwt = f'flux-api-v1-{env.pStage}-jwt-secret'
try:
    jwt_secret = binascii.unhexlify(ssm.get_parameter(Name=ssm_jwt, WithDecryption=True)['Parameter']['Value'])
except Exception as e:
    logging.warning(f"GET SSM JWT SECRET EXCEPTION: {e}")
    logging.warning(f"Creating and saving JWT secret")
    jwt_secret = os.urandom(32)
    ssm.put_parameter(Name=ssm_jwt, Value=binascii.hexlify(jwt_secret).decode(), Type='SecureString')


class TokenError(NamedTuple):
    error_code: int
    error_msg: str
    exception: Optional[Exception] = None


E = TypeVar('E')
E2 = TypeVar('E2')
D = TypeVar('D')
D2 = TypeVar('D2')

T = TypeVar('T')
M = TypeVar('M')

class Either(pymonad.either.Either, Generic[E, D]):
    def fmap(self, f: Callable[[D], D2]) -> 'Either[E, D2]':
        return super().fmap(f)

    def amap(self, f: Callable[[D], D2]) -> 'Either[E, D2]':
        return super().amap(f)

    def bind(self, f: Callable[[D], 'Either[E,D2]']) -> 'Either[E, D2]':
        return super().bind(f)

    def abind(self, f):
        async def do():
            return self
        if self.is_left():
            return ABindHelper(do())
        return ABindHelper(f(self.getValue()), depth=1)

class ABindHelper(asyncio.Task):
    def __init__(self, coro: Coroutine, depth=0, *args):
        super().__init__(coro)
        self.depth = depth

    def abind(self, f):
        # logging.info("abind called")
        async def do():
            # logging.info(f"abind.do started {self.depth}")
            v = await self
            # logging.info(f"abind.do {self.depth} got v {v}, abind-ing to {f.__name__}")
            return await v.abind(f)

        return ABindHelper(do(), depth=self.depth + 1)

def Left(value: M) -> Either[M, Any]: # pylint: disable=invalid-name
    """ Creates a value of the first possible type in the Either monad. """
    return Either(None, (value, False))

def Right(value: T) -> Either[Any, T]: # pylint: disable=invalid-name
    """ Creates a value of the second possible type in the Either monad. """
    return Either(value, (None, True))


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
            return await inner2()
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"[ERROR]: {repr(e)} {str(e)}, {type(e)}")
            raise e
    return inner


async def has_role(role_name, uid):
    return await db.has_role(role_name, uid)



async def auth_extra_default(role, handler, data, *args, **kwargs):
    return True


def decode_jwt(token) -> Either[TokenError, AttrDict]:
    try:
        d = AttrDict(jwt.decode(token, jwt_secret, algorithms=['HS256']))
        d.update({} if 'uid' not in d else {'uid': ObjectId(d.uid)})
        return Right(d)
    except Exception as ex:
        return Left(TokenError(401, "Failed to decode token", ex))


def now():
    return int(time.time())


# keep in sync with flux-api/flux/handlers/auth.py

def header_auth_role(role, auth_extra=auth_extra_default):
    def _auth_role(f):
        assert asyncio.iscoroutinefunction(f)

        async def inner(*args, **kwargs):
            auth_type, auth_val = request.headers.get('Authorization', ' ').split(' ', 1)

            def _401(msg):
                return Left(TokenError(401, msg))

            l_auth_fail = _401("Auth Conditions Failed")
            l_invalid_token = _401("Invalid Token")

            auth = _401("Not Bearer Token") if auth_type != "Bearer" else Right(auth_val)

            async def has_uid(token: AttrDict):
                return l_invalid_token if 'uid' not in token else Right(token)

            # async def check_expiry(token):
            #     return l_invalid_token if token.get('exp', 0) < now()

            async def check_role(token):
                return l_auth_fail if not await db.user_has_role(token.uid, role) else Right(token)

            async def check_auth_extra(token):
                return l_auth_fail if not (await auth_extra(role, token, *args, **kwargs)) else Right(token)

            async def check_session(token):
                if 'sid' not in token:
                    return l_auth_fail
                try:
                    with Exception("hdr_auth: check_session"):
                        _log_doc = await db.find_session_id(token.uid, token.sid)
                        assert _log_doc is not None
                        assert _log_doc['expires'] > now()
                        return Right(token)
                except Exception as _e:
                    logging.error(f"Exception in hdr_auth.check_session: {_e}")
                    return l_auth_fail

            result = await auth.bind(decode_jwt)\
                .abind(has_uid)\
                .abind(check_role)\
                .abind(check_auth_extra)\
                .abind(check_session)
            logging.info(f"Auth result: {result}")

            if type(result) is Left:
                te = result.getValue()
                return handler.send_error(te.error_code)

            if handler.request.method in ["POST", "PUT", "PATCH"]:
                data = json.loads(handler.request.body or "{}")
                args = list(args)
                args.insert(0, data)

            # args has data at index 0 for POST, PUT, PATCH
            return await f(handler, result.getValue().uid, *args, **kwargs)
        return inner
    return _auth_role


header_auth_user = header_auth_role('user')
