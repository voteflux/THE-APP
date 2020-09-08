import json
import datetime
import time
from enum import Enum

from authlib.oauth2.rfc6749 import grants
from authlib.oauth2.rfc6749.util import list_to_scope, scope_to_list
from pymonad.maybe import Maybe
from pynamodb.indexes import GlobalSecondaryIndex, AllProjection
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, BooleanAttribute, UTCDateTimeAttribute, ListAttribute, MapAttribute, \
    NumberAttribute

from flux import env
from flux.utils import d_get, d_remove
from flux.db import BaseModel, DefMeta, LookupModel, gen_id, lookup_indirect


class IxTys(Enum):
    REF_TOK = "oauth:rt"
    TOK_ID = "oauth:tid"


def make_lookup_key(in_ix_ty: IxTys, val: str, out_ix_ty: IxTys):
    return "|".join([in_ix_ty, val, out_ix_ty])


def gen_table_name(name):
    if name.endswith("ddb"):
        raise Exception("Table name has trailing 'ddb'")
    t_prefix = env.pTablePrefix
    if name.startswith(t_prefix):
        raise Exception(f"Table name starts with '{t_prefix}'")
    return f"{env.pNamePrefix}-{t_prefix}-{name}-ddb"


class OauthUser(BaseModel):
    class Meta(DefMeta):
        table_name = gen_table_name("users")

    # As in the Flux DB
    uid = UnicodeAttribute(hash_key=True)

    def get_user_id(self):
        return self.uid


class OauthClientApp(BaseModel):
    """ Model of oauth2 client app. 
    Note that scopes are space-delimited capitalization sensitive lists encoded as strings.
    """

    class Meta(DefMeta):
        table_name = gen_table_name("client-apps")
    
    client_id = UnicodeAttribute(hash_key=True)
    client_secret = UnicodeAttribute()
    client_type_public = BooleanAttribute()
    default_redirect_uri = UnicodeAttribute()
    default_scopes = ListAttribute(default=list)
    allowed_redirect_uris = ListAttribute(default=list)
    allowed_grant_types = ListAttribute(default=list)
    allowed_response_types = ListAttribute(default=list)
    created_ts = UTCDateTimeAttribute(default=datetime.datetime.now)
    validate_scopes_f = UnicodeAttribute()

    @property
    def client_type(self):
        return 'public' if self.client_type_public else 'confidential'

    def check_client_secret(self, client_secret):
        return self.client_secret == client_secret

    def check_grant_type(self, grant_type):
        return grant_type in self.allowed_grant_types

    def check_redirect_uri(self, redirect_uri):
        return redirect_uri in self.allowed_redirect_uris

    def check_response_type(self, response_type):
        return response_type in self.allowed_response_types

    def get_allowed_scope(self, scope):
        if not scope:
            return ''
        allowed = set(self.default_scopes)
        return list_to_scope([s for s in scope.split() if s in allowed])

    def get_client_id(self):
        return self.client_id

    def get_default_redirect_uri(self):
        return self.default_redirect_uri

    def has_client_secret(self):
        return bool(self.client_secret)

    # def check_token_endpoint_auth_method(self, method):



class OauthCodeGrant(BaseModel):
    """ Oauth2 Grant """
    class Meta(DefMeta):
        table_name = gen_table_name("grants")

    id = UnicodeAttribute(hash_key=True)
    user_id = UnicodeAttribute()
    client_id = UnicodeAttribute()
    code = UnicodeAttribute()
    code_challenge = UnicodeAttribute()
    code_challenge_method = UnicodeAttribute()
    redirect_uri = UnicodeAttribute()
    expires = UTCDateTimeAttribute()
    scopes = ListAttribute(default=list)

    def from_auth_code(self):
        lookup =


class AuthorizationCodeGrant(grants.AuthorizationCodeGrant):
    def save_authorization_code(self, code, request):
        c = request.client
        auth_code = OauthCodeGrant(
            id=gen_id("acg-", 20),
            client_id=c.client_id,
            redirect_uri=request.redirect_uri,
            scopes=scope_to_list(request.scope),
            user_id=request.user.id,
        )
        auth_code.save()
        return auth_code

    def delete_authorization_code(self, authorization_code):
        OauthCodeGrant.get(authorization_code)

    def auth_methods(self):
        TOKEN_ENDPOINT_AUTH_METHODS = ['client_secret_basic', 'client_secret_post']


class OauthToken(BaseModel):
    """ Oauth2 Bearer Token """
    class Meta(DefMeta):
        table_name = gen_table_name("bearer-tokens")

    id = UnicodeAttribute(hash_key=True)
    client_id = UnicodeAttribute()
    user_id = UnicodeAttribute()
    token_type = UnicodeAttribute()
    access_token = UnicodeAttribute()
    refresh_token = UnicodeAttribute()
    expires_in = NumberAttribute()
    created_at = NumberAttribute()
    scopes = ListAttribute(default=list)

    def get_client_id(self):
        return self.client_id

    def get_expires_at(self):
        return self.created_at + self.expires_in

    def get_expires_in(self):
        return self.expires_in

    def get_scope(self):
        return list_to_scope(self.scopes)

    def is_refresh_token_active(self):
        return self.get_expires_at() > time.time()

    @classmethod
    def from_refresh_token(cls, refresh_token):
        return lookup_indirect(cls, make_lookup_key(IxTys.REF_TOK, refresh_token, IxTys.TOK_ID))


