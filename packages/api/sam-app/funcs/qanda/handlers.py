import datetime
import json
import logging
import uuid

from pymonad import Nothing, Maybe, Just

from flux.auth import has_role
from flux.exceptions import LambdaError
from flux.handler_utils import get_common, auth_common
from attrdict import AttrDict
from pynamodb.indexes import GlobalSecondaryIndex, AllProjection
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, BooleanAttribute, UTCDateTimeAttribute, ListAttribute, MapAttribute

from flux import env
from flux.utils import d_get, d_remove
from flux.email import email_notify_new_reply


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


class UidPrivate(BaseModel):
    def strip_private(self):
        return d_remove('uid', super().strip_private())


class Ix(GlobalSecondaryIndex):
    class Meta:
        projection = AllProjection()


class QuestionModel(UidPrivate):
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


class UserQuestionLogEntry(MapAttribute):
    ts = UTCDateTimeAttribute()
    qid = UnicodeAttribute()


class UserQuestionsModel(BaseModel):
    class Meta:
        table_name = gen_table_name("qanda-user-qs-ddb")
        region = env.AWS_REGION

    uid = UnicodeAttribute(hash_key=True)
    qs = ListAttribute(of=UserQuestionLogEntry, default=list)


class GenericPointer(MapAttribute):
    ts = UTCDateTimeAttribute()
    id = UnicodeAttribute()


class ReplyIdsByQid(BaseModel):
    class Meta:
        table_name = gen_table_name("qanda-reply-ids-ddb")
        region = env.AWS_REGION

    qid = UnicodeAttribute(hash_key=True)
    rids = ListAttribute(of=GenericPointer, default=list)


class ReplyIdsByUid(BaseModel):
    class Meta:
        table_name = gen_table_name("qanda-reply-ids-by-uid-ddb")
        region = env.AWS_REGION

    uid = UnicodeAttribute(hash_key=True)
    rids = ListAttribute(of=GenericPointer, default=list)


class Reply(UidPrivate):
    class Meta:
        table_name = gen_table_name("qanda-replies-ddb")
        region = env.AWS_REGION

    rid = UnicodeAttribute(hash_key=True)
    qid = UnicodeAttribute()
    uid = UnicodeAttribute()
    body = UnicodeAttribute()
    ts = UTCDateTimeAttribute()
    parent_rid = UnicodeAttribute(null=True)
    child_rids = ListAttribute(of=GenericPointer, default=list)
    is_staff = BooleanAttribute()
    display_name = UnicodeAttribute()


def sort_qs_by_ts(qs):
    return sorted(qs, key=d_get('ts'), reverse=True)


@auth_common
async def get_mine(event, ctx, user, *args, **kwargs):
    qs_log = UserQuestionsModel.get_or(str(user['_id']), default=AttrDict({'qs': []})).qs
    qs = sort_qs_by_ts([q if type(q) is dict else q.to_python() for q_log in qs_log
                        for q in [QuestionModel.get_or(q_log.qid, default={})]
                        ])
    return {"questions": qs}


@get_common
async def get_all(event, ctx):
    global_log = UserQuestionsModel.get_or("global", default=UserQuestionsModel(uid="global", qs=[]))
    print('global_log', global_log)
    qs = sort_qs_by_ts([q.strip_private() for q in QuestionModel.batch_get([q['qid'] for q in global_log.qs])])
    print('qs', qs)
    return {'questions': qs}


@get_common
async def get_question(event, ctx):
    return QuestionModel.get(event.pathParameters.qid).strip_private()


def mk_first_plus_initial(user):
    return ' '.join([user['fname'].title(), user['sname'][0].title()])


def mk_last_plus_initial(user):
    return ' '.join([user['fname'][0].title(), user['sname'].title()])


def mk_full_name(user):
    return ' '.join([user['fname'].title(), user['sname'].title()])


def gen_display_name(user, display_choice):
    return {
        'anon': "Anonymous",
        'first_plus_initial': mk_first_plus_initial(user),
        'last_plus_initial': mk_last_plus_initial(user),
        'full_name': mk_full_name(user)
    }[display_choice]


@auth_common
async def submit(event, ctx, user, *args, **kwargs):
    data = event.body
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
        raise Exception("Your question is too large!")
    if not (10 < len(title) <= 200):
        raise Exception("Your title is too long!")
    ts = datetime.datetime.now()
    params = {
        'qid': qid,
        'uid': uid,
        'display_name': gen_display_name(user, data.display_choice),
        'is_anon': display_choice == "anon",
        'question': question,
        'title': title,
        'ts': ts
    }
    params.update({'prev_q': prev_q} if prev_q else {})
    q = QuestionModel(**params)
    q.save()
    update_actions = [
        UserQuestionsModel.qs.set((UserQuestionsModel.qs | []).prepend([UserQuestionLogEntry(ts=ts, qid=q.qid)]))]
    UserQuestionsModel(uid="global").update(actions=update_actions)
    UserQuestionsModel(uid=uid).update(actions=update_actions)
    return {'submitted': True, 'qid': qid}


@auth_common
async def submit_reply(event, ctx, user, *args, **kwargs):
    data = event.body
    uid = str(user['_id'])
    rid = str(uuid.uuid4())
    qid = data.qid
    qM = QuestionModel.get_maybe(qid)
    if qM == Nothing:
        raise LambdaError(404, 'question not found')
    body = data.body
    if not (0 < len(body) <= 4000):
        raise Exception("Your question is too large!")
    ts = datetime.datetime.now()
    parent_rid = data.get('parent_rid', None)
    child_rids = list()
    is_staff = await has_role('qanda_staff', user['_id'])
    r = Reply(rid=rid, qid=qid, uid=uid, body=body, ts=ts, parent_rid=parent_rid, child_rids=child_rids,
              is_staff=is_staff, display_name=gen_display_name(user, data.display_choice))
    r.save()
    update_actions = [ReplyIdsByQid.rids.set((ReplyIdsByQid.rids | []).prepend([GenericPointer(ts=ts, id=rid)]))]
    ReplyIdsByQid(qid="global").update(actions=update_actions)
    ReplyIdsByQid(qid=qid).update(actions=update_actions)
    ReplyIdsByUid(uid=uid).update(actions=update_actions)
    await email_notify_new_reply(uid, r, qM.getValue())
    return r.to_python()


@get_common
async def get_reply_ids(event, ctx):
    qid = event.pathParameters.qid
    return [l.id for l in ReplyIdsByQid.get_or(qid, default=AttrDict({'rids': []})).rids]


@get_common
async def get_reply(event, ctx):
    rid = event.pathParameters.rid
    reply = Reply.get_maybe(rid)
    if reply == Nothing:
        raise LambdaError(404, "not found")
    return reply.getValue().strip_private()
