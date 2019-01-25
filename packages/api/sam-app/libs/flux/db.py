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


async def find_user(data):
    if 's' in data:
        return await mongo.users.find_one({'s': _eq(data['s'])})
