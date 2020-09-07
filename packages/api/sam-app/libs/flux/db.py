import datetime
import json
import os

from attrdict import AttrDict
import boto3
from . import env
from motor.motor_asyncio import AsyncIOMotorClient
from pymonad.maybe import Maybe, Nothing, Just
from pynamodb.models import Model

ssm = boto3.client('ssm')


def get_ssm(name, with_decryption=False):
    print(f"getting ssm: {name}")
    ret = ssm.get_parameter(Name=name, WithDecryption=with_decryption)['Parameter']['Value']
    print(f"got ssm value of length: {len(ret)}")
    return ret


print('orig mongo')
mongodb_uri = env.get('MONGODB_URI', None)
if not mongodb_uri:
    print('alt mongo')
    mongodb_uri = get_ssm(f'{env.pNamePrefix}-mongodb-uri', with_decryption=True)
mongo_client = AsyncIOMotorClient(mongodb_uri)
mongo = mongo_client[mongodb_uri.rsplit('/')[-1].rsplit('?')[0]]

_eq = lambda v: {'$eq': v}


def attrdict(f):
    async def inner(*args, **kwargs):
        retval = await f(*args, **kwargs)
        if type(retval) is dict:
            return AttrDict(retval)
        return retval
    return inner


@attrdict
async def find_user(data):
    if '_id' in data:
        return await mongo.users.find_one({'_id': _eq(data['_id'])})
    return await mongo.users.find_one({'s': _eq(data.get('s', None))})


async def user_roles(uid):
    roles_all = await mongo.roles.find({'uids': uid}).to_list(None)
    roles = list([r['role'] for r in (roles_all if roles_all is not None else [])])
    return roles


# async def has_role(role_name, uid):
#     return await mongo.roles.find_one({'uids': uid, 'role': {'$eq': role_name}}) is not None


async def get_user_by_id(uid, db_inst=mongo):
    return await find_user({'_id': uid})


async def has_role(uid, role, db_inst=mongo):
    # check the user exists first
    if (await get_user_by_id(uid, db_inst=db_inst)) is None:
        return False

    if role == 'user':  # user role is special and generic, provided user exists this is always true
        return True

    if await db_inst.roles.find_one({'uids': uid, 'role': {'$eq': role}}) is None:
        return False  # if we can't find the role

    return True


async def find_session_id(uid, session_id):
    return await mongo.auth_session_ids.find_one({'uid': uid, 'session_id': session_id})


# pynamodb


class DefMeta:
    region = env.AWS_REGION


class ModelEncoder(json.JSONEncoder):
    def default(self, obj):
        if hasattr(obj, 'attribute_values'):
            return obj.attribute_values
        elif isinstance(obj, datetime.datetime):
            return obj.isoformat()
        return json.JSONEncoder.default(self, obj)


class BaseModel(Model):
    @classmethod
    def get_or(cls, *args, default=None):
        if default is None:
            raise Exception('must provide a default')
        try:
            return super().get(*args)
        except super().DoesNotExist as e:
            return default

    @classmethod
    def get_maybe(cls, *args):
        try:
            return Just(super().get(*args))
        except super().DoesNotExist as e:
            return Nothing

    def to_json(self):
        return json.dumps(self, cls=ModelEncoder)

    def to_python(self):
        return json.loads(self.to_json())

    def strip_private(self):
        return self.to_python()

