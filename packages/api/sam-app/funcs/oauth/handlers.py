from datetime import datetime, timedelta
import logging

from flask import request
from werkzeug.utils import cached_property
import werkzeug

setattr(werkzeug, 'cached_property', cached_property)

from apig_wsgi import make_lambda_handler
from attrdict import AttrDict

from .oauth2 import authorization

# from .models import OauthToken, OauthClientApp, OauthGrant, OauthUser


app = authorization


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


@app.route('/oauth/authorize', methods=['GET', 'POST'])
def authorize():
    # Login is required since we need to know the current resource owner.
    # It can be done with a redirection to the login page, or a login
    # form on this authorization page.
    if request.method == 'GET':
        grant = authorization.validate_consent_request(end_user=current_user)
        return render_template(
            'authorize.html',
            grant=grant,
            user=current_user,
        )
    confirmed = request.form['confirm']
    if confirmed:
        # granted by resource owner
        return server.create_authorization_response(grant_user=current_user)
    # denied by resource owner
    return server.create_authorization_response(grant_user=None)
