from datetime import datetime, timedelta
import logging

from werkzeug.utils import cached_property
import werkzeug

setattr(werkzeug, 'cached_property', cached_property)

from flask import Flask
from flask_oauthlib.provider import OAuth2Provider
from apig_wsgi import make_lambda_handler
from attrdict import AttrDict

# from .models import OauthBearerToken, OauthClientApp, OauthGrant, OauthUser


app = Flask(__name__)
oauth = OAuth2Provider(app)


# @oauth.clientgetter
# def load_client(client_id):
#     return OauthClientApp.get_or(client_id)


# @oauth.grantgetter
# def load_grant(client_id, code):
#     # OauthGrantGetter.get_maybe()
#     return OauthGrant.get_or(client_id=client_id, code=code)


# @oauth.grantsetter
# def save_grant(client_id, code, request, *args, **kwargs):
#     # decide the expires time yourself
#     expires = datetime.utcnow() + timedelta(seconds=100)
#     grant = OauthGrant(
#         client_id=client_id,
#         code=code['code'],
#         redirect_uri=request.redirect_uri,
#         scopes=request.scopes,
#         # user=get_current_user(),
#         expires=expires
#     )
#     grant.save()
#     return grant


def main(event, ctx):
    _e = AttrDict(event)
    path_tail = _e.resource.split("/")[2]
    print(f"About to call {path_tail}, {_e.pathParameters}")
    print(_e)

    # get_handlers = {
    #     'authorize': oa_auth_get,
    # }
    # post_handlers = {
    #     'authorize': oa_auth_post,
    # }
    #
    # ret = {
    #     'GET': get_handlers,
    #     'POST': post_handlers,
    # }[_e.httpMethod.upper()][path_tail](_e, ctx)
    ret = make_lambda_handler(app.wsgi_app)(event, ctx)

    # ensure_cors(ret)
    logging.info(f"[INFO] Returning {ret}")
    print(f"Returning {ret}")
    return ret


# def oa_auth_get(e, ctx):
#     pass
#
#
# def oa_auth_post(e, ctx):
#     pass
