import json
import datetime

from pymonad import Nothing, Maybe, Just
from pynamodb.indexes import GlobalSecondaryIndex, AllProjection
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, BooleanAttribute, UTCDateTimeAttribute, ListAttribute, MapAttribute

from flux import env
from flux.utils import d_get, d_remove
from flux.pynamodb import BaseModel, DefMeta


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
    
    id = UnicodeAttribute(hash_key=True)
    flux_uid = UnicodeAttribute()


class OauthClientApp(BaseModel):
    """ Model of oauth2 client app. 
    Note that scopes are space-delimited capitalization sensitive lists encoded as strings.
    """

    class Meta(DefMeta):
        table_name = gen_table_name("client-apps")
    
    client_id = UnicodeAttribute(hash_key=True)
    client_secret = UnicodeAttribute()
    client_type_public = BooleanAttribute()
    redirect_uris = ListAttribute(of=UnicodeAttribute, default=list)
    default_redirect_uri = UnicodeAttribute()
    default_scopes = UnicodeAttribute()
    allowed_grant_types = ListAttribute(of=UnicodeAttribute, default=list)
    allowed_response_types = ListAttribute(of=UnicodeAttribute, default=list)
    validate_scopes_f = UnicodeAttribute()

    @property
    def client_type(self):
        return 'public' if self.client_type_public else 'confidential'


class OauthGrant(BaseModel):
    """ Oauth2 Grant """
    class Meta(DefMeta):
        table_name = gen_table_name("grants")

    id = UnicodeAttribute(hash_key=True)
    user_id = UnicodeAttribute()
    client_id = UnicodeAttribute()
    code = UnicodeAttribute()
    redirect_uri = UnicodeAttribute()
    expires = UTCDateTimeAttribute()
    scopes = ListAttribute(of=UnicodeAttribute, default=list)


class OauthBearerToken(BaseModel):
    """ Oauth2 Bearer Token """
    class Meta(DefMeta):
        table_name = gen_table_name("bearer-tokens")

    id = UnicodeAttribute(hash_key=True)
    client_id = UnicodeAttribute()
    user_id = UnicodeAttribute()
    token_type = UnicodeAttribute()
    access_token = UnicodeAttribute()
    refresh_token = UnicodeAttribute()
    expires = UTCDateTimeAttribute()
    scopes = ListAttribute(of=UnicodeAttribute, default=list)

class UidPrivate(BaseModel):
    def strip_private(self):
        return d_remove('uid', super().strip_private())
