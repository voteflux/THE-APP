import asyncio
import datetime
import json
import logging
import os
import uuid
from typing import Callable

import boto3
from motor.motor_asyncio import AsyncIOMotorClient
from attrdict import AttrDict
from pynamodb.indexes import GlobalSecondaryIndex, AllProjection
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, BooleanAttribute, UTCDateTimeAttribute, ListAttribute, MapAttribute

env = AttrDict(os.environ)
print(env)

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


def gen_status(status, body=None, headers=None):
    ret = {'statusCode': status, 'headers': {'content-type': 'application/json'}}
    ret.update({'body': body} if body is not None else {})
    ret['headers'].update(headers if headers is not None else {})
    return ret


def err(msg):
    return {'error': msg}


def success(body):
    return gen_status(200, json.dumps(body))


def gen_table_name(name):
    return f"{env.pNamePrefix}-{name}"


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

    def to_json(self):
        return json.dumps(self, cls=ModelEncoder)

    def to_python(self):
        return json.loads(self.to_json())

class Ix(GlobalSecondaryIndex):
    class Meta:
        projection = AllProjection()


class QuestionModel(BaseModel):
    class Meta:
        table_name = gen_table_name("qanda-questions-ddb")
        region = env.AWS_REGION

    qid = UnicodeAttribute(hash_key=True)
    uid = UnicodeAttribute()
    display_name = UnicodeAttribute()
    is_anon = BooleanAttribute()
    question = UnicodeAttribute()
    title = UnicodeAttribute()
    prev_q = UnicodeAttribute(null=True)
    next_q = UnicodeAttribute(null=True)
    ts = UTCDateTimeAttribute()

    def strip_private(self):
        ret = self.to_python()
        del ret['uid']
        return ret


class UserQuestionLogEntry(MapAttribute):
    ts = UTCDateTimeAttribute()
    qid = UnicodeAttribute()


class UserQuestionsModel(BaseModel):
    class Meta:
        table_name = gen_table_name("qanda-user-qs-ddb")
        region = env.AWS_REGION

    uid = UnicodeAttribute(hash_key=True)
    qs = ListAttribute(of=UserQuestionLogEntry, default=list)


def auth(f):
    def inner(data, *args, **kwargs):
        async def inner2():
            print("started", {'s': _eq(data['s'])})
            user = await mongo.users.find_one({'s': _eq(data['s'])})
            if user is not None:
                print("got user", user['_id'])
            data.update({'s': '*************'})
            if user is not None:
                return await f(data, user, *args, **kwargs)
            print("user failed auth")
            return gen_status(403, err("Unauthorized"))

        try:
            loop = asyncio.get_event_loop()
            ret = loop.run_until_complete(inner2())
            print(f"auth-inner got good return: {ret}")
            return ret
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"[ERROR]: {repr(e)} {str(e)}, {type(e)}")
        return gen_status(500)

    return inner


@auth
async def get_mine(data, user, *args, **kwargs):
    # try:
    #     qs_log = UserQuestionsModel.get(str(user['_id'])).qs
    # except UserQuestionsModel.DoesNotExist as e:
    #     qs_log = []
    qs_log = UserQuestionsModel.get_or(str(user['_id']), default=AttrDict({'qs': []})).qs
    qs = []
    print(qs_log)
    for q_log in qs_log:
        print(q_log)
        q = QuestionModel.get_or(q_log.qid, default={})
        qs.append(q if type(q) is dict else q.to_python())
    return success({"questions": qs})


def get_all():
    global_log = UserQuestionsModel.get_or("global", default=UserQuestionsModel(uid="global", qs=[]))
    qs = [q.strip_private() for q in QuestionModel.batch_get([QuestionModel(qid=qid) for qid in global_log.qs])]
    return success({'questions': qs})


def mk_first_plus_initial(user):
    return ' '.join([user['fname'].title(), user['sname'][0].title()])


def mk_last_plus_initial(user):
    return ' '.join([user['fname'][0].title(), user['sname'].title()])


def mk_full_name(user):
    return ' '.join([user['fname'].title(), user['sname'].title()])


@auth
async def submit(data, user, *args, **kwargs):
    uid = str(user['_id'])
    qid = str(uuid.uuid4())
    prev_q = data.get('prev_q', None)
    display_choice = data['display_choice']
    title = data['title']
    if prev_q:
        full_prev_q = QuestionModel.get(prev_q)
        if full_prev_q.uid != uid:
            raise Exception("prev_q does not match!")
    question = data['question']
    if not (20 < len(question) <= 4000):
        return err("Your question is too large!")
    if not (10 < len(title) <= 200):
        return err("Your title is too long!")
    ts = datetime.datetime.now()
    params = {
        'qid': qid,
        'uid': uid,
        'display_name': {
            'anon': "Anonymous",
            'first_plus_initial': mk_first_plus_initial(user),
            'last_plus_initial': mk_last_plus_initial(user),
            'full_name': mk_full_name(user)
        }[display_choice],
        'is_anon': display_choice == "anon",
        'question': question,
        'title': title,
        'ts': ts
    }
    params.update({'prev_q': prev_q} if prev_q else {})
    q = QuestionModel(**params)
    q.save()
    UserQuestionsModel(uid=uid).update(actions=[
        UserQuestionsModel.qs.set((UserQuestionsModel.qs | []).prepend([UserQuestionLogEntry(ts=ts, qid=q.qid)]))
    ])
    UserQuestionsModel(uid="global").update(actions=[
        UserQuestionsModel.qs.set((UserQuestionsModel.qs | []).prepend([UserQuestionLogEntry(ts=ts, qid=q.qid)]))
    ])
    return success({'submitted': True, 'qid': qid})
