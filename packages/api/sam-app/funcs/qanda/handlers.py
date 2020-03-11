import datetime
import json
import logging
import uuid

from pymonad import Nothing, Maybe, Just

from attrdict import AttrDict

from flux.utils import d_get, d_remove, gen_display_name
from flux.email import email_notify_new_reply
from flux.auth import has_role
from flux.exceptions import LambdaError
from flux.handler_utils import get_common, auth_common
from models import UserQuestionsModel, QuestionModel, ReplyIdsByUid, ReplyIdsByQid, Reply, GenericPointer, \
    UserQuestionLogEntry


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
    # print('global_log', global_log)
    qs = sort_qs_by_ts([q.strip_private() for q in QuestionModel.batch_get([q['qid'] for q in global_log.qs])])
    # print('qs', qs)
    return {'questions': qs}


@get_common
async def get_question(event, ctx):
    return {'question': QuestionModel.get(event.pathParameters.qid).strip_private()}


@auth_common
async def submit(event, ctx, user, *args, **kwargs):
    data = event.body
    uid = str(user['_id'])
    qid = 'q' + str(uuid.uuid4())[:13]
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
        'qid': qid, 'uid': uid, 'display_name': gen_display_name(user, data.display_choice),
        'is_anon': display_choice == "anon", 'question': question, 'title': title, 'ts': ts
    }
    params.update({'prev_q': prev_q} if prev_q else {})
    q = QuestionModel(**params)
    q.save()
    update_actions = [
        UserQuestionsModel.qs.set((UserQuestionsModel.qs | []).prepend([UserQuestionLogEntry(ts=ts, qid=q.qid)]))]
    UserQuestionsModel(uid="global").update(actions=update_actions)
    UserQuestionsModel(uid=uid).update(actions=update_actions)
    return {'submitted': True, 'qid': qid, 'question': q.to_python()}


@auth_common
async def submit_reply(event, ctx, user, *args, **kwargs):
    data = event.body
    replier_uid = str(user['_id'])
    rid = 'r' + str(uuid.uuid4())[:13]
    qid = data.qid
    q_m = QuestionModel.get_maybe(qid)
    if q_m == Nothing:
        raise LambdaError(404, 'question not found')
    body = data.body
    if not (0 < len(body) <= 4000):
        raise Exception("Your question is too large!")
    ts = datetime.datetime.now()
    parent_rid = data.get('parent_rid', None)
    child_rids = list()
    is_staff = await has_role('qanda_staff', user['_id'])
    r = Reply(rid=rid, qid=qid, uid=replier_uid, body=body, ts=ts, parent_rid=parent_rid, child_rids=child_rids,
              is_staff=is_staff, display_name=gen_display_name(user, data.display_choice))
    r.save()
    update_actions = [ReplyIdsByQid.rids.set((ReplyIdsByQid.rids | []).prepend([GenericPointer(ts=ts, id=rid)]))]
    ReplyIdsByQid(qid="global").update(actions=update_actions)
    ReplyIdsByQid(qid=qid).update(actions=update_actions)
    ReplyIdsByUid(uid=replier_uid).update(actions=update_actions)
    await email_notify_new_reply(replier_uid, r, q_m.getValue())
    return {'reply': r.to_python(), 'submitted': True, 'rid': rid}


@get_common
async def get_reply_ids(event, ctx):
    qid = event.pathParameters.qid
    return {'reply_ids': [l.id for l in ReplyIdsByQid.get_or(qid, default=AttrDict({'rids': []})).rids]}


@get_common
async def get_reply(event, ctx):
    rid = event.pathParameters.rid
    reply = Reply.get_maybe(rid)
    if reply == Nothing:
        raise LambdaError(404, "not found")
    return {'reply': reply.getValue().strip_private()}
