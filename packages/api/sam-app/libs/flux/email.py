import asyncio

import boto3
import os
import logging

import flux.db as db
from mako.template import Template
from flux import env

from bson import ObjectId

ses = boto3.client('ses', region_name='us-east-1')
log = logging.getLogger('email')
log.setLevel(logging.INFO)


def default_params():
    return {
        'feedbackEmail': env.pFeedbackEmail
    }


def render_factory(path):
    def inner(format, **params):
        filename = '.'.join([path, format])
        return Template(filename=f'{os.path.dirname(__file__)}/email_templates/{filename}').render(**params)

    return inner


def send_email(source=None, to_addrs=None, cc_addrs=None, bcc_addrs=None, subject=None, body_txt=None, body_html=None,
               reply_tos=None):
    return ses.send_email(Source=source, Destination={
        'ToAddresses': to_addrs or [],
        'CcAddresses': cc_addrs or [],
        'BccAddresses': bcc_addrs or [],
    }, Message={
        'Subject': {'Data': subject},
        'Body': {
            'Text': {'Data': body_txt},
            'Html': {'Data': body_html}
        }
    }, ReplyToAddresses=reply_tos or [source])


async def email_notify_new_reply(replier_uid, reply, question):
    render = render_factory('qanda/new_reply')
    reply_user_f = asyncio.ensure_future(db.find_user({'_id': ObjectId(replier_uid)}))
    question_user = await db.find_user({'_id': ObjectId(question.uid)})
    reply_user = await reply_user_f
    if reply_user is None or question_user is None:
        log.warning(f"Unable to find reply_user / question_user: {replier_uid} / {question.uid}")
        return
    params = default_params()
    params.update({
        'r': reply,
        'fname': question_user.get('fname', ''),
        'q': question,
        'reply_url': f'{env.pBaseUrl}/qanda/thread/{question.qid}',
    })
    print(env.pQandaFromEmail, question_user.email, env)
    send_email(source=env.pQandaFromEmail, to_addrs=[question_user.email],
               subject=f'[{env.pSiteNameShort}/QAndA] new reply to "{question.title}"',
               body_txt=render('txt', **params), body_html=render('html', **params))
