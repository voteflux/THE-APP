import boto3
import os

import flux.db as db
from mako.template import Template
from flux import env

from bson import ObjectId

ses = boto3.client('ses', region_name='us-east-1')


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


async def email_notify_new_reply(uid, reply, question):
    render = render_factory('qanda/new_reply')
    user = await db.find_user({'_id': ObjectId(uid)})
    if user is None:
        raise Exception(f'User with uid {uid} not found.')
    params = default_params()
    params.update({
        'r': reply,
        'fname': user.get('fname', ''),
        'q': question,
        'reply_url': f'{env.pBaseUrl}/qanda/thread/{question.qid}',
    })
    print(env.pQandaFromEmail, user.email, env)
    send_email(source=env.pQandaFromEmail, to_addrs=[user.email],
               subject=f'[{env.pSiteNameShort}/QAndA] new reply to "{question.title}"',
               body_txt=render('txt', **params), body_html=render('html', **params))
