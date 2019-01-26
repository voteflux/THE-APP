import os

from attrdict import AttrDict
import boto3
from flux import env
from motor.motor_asyncio import AsyncIOMotorClient


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
    rolesAll = await mongo.roles.find({'uids': uid}).to_list(None)
    roles = list([r['role'] for r in (rolesAll if rolesAll is not None else [])])
    return roles


async def has_role(role_name, uid):
    return await mongo.roles.find_one({'uids': uid, 'role': {'$eq': role_name}}) is not None

