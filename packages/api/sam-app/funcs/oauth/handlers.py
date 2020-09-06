import flask_oauthlib as oauth

from models import OauthBearerToken, OauthClientApp, OauthGrant, OauthUser


@oauth.clientgetter
def load_client(client_id):
    return OauthClientApp.get_or(client_id)


@oauth.grantgetter
def load_grant(client_id, code):
    OauthGrantGetter.get_maybe()
    return OauthGrant.get_or(client_id=client_id, code=code)


@oauth.grantsetter
def save_grant(client_id, code, request, *args, **kwargs):
    # decide the expires time yourself
    expires = datetime.utcnow() + timedelta(seconds=100)
    grant = Grant(
        client_id=client_id,
        code=code['code'],
        redirect_uri=request.redirect_uri,
        _scopes=' '.join(request.scopes),
        user=get_current_user(),
        expires=expires
    )
    db.session.add(grant)
    db.session.commit()
    return grant


def main(event, ctx):
    _e = AttrDict(event)
    path_tail = _e.resource.split("/")[2]
    print(f"About to call {path_tail}, {_e.pathParameters}")
    print(_e)

    get_handlers = {
        'get': handlers.get_all,
        'question': handlers.get_question,
        'replyIds': handlers.get_reply_ids,
        'reply': handlers.get_reply,
    }
    post_handlers = {
        'getMine': handlers.get_mine,
        'submit': handlers.submit,
        'submitReply': handlers.submit_reply,
    }

    ret = {
        'GET': get_handlers,
        'POST': post_handlers,
    }[_e.httpMethod.upper()][path_tail](_e, ctx)

    # ensure_cors(ret)
    logging.info(f"[INFO] Returning {ret}")
    print(f"Returning {ret}")
    return ret