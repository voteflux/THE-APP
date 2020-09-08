import datetime
import json
import uuid
from enum import Enum
from typing import TypeVar, Union, List

from . import env
from attrdict import AttrDict
import boto3
from botocore.errorfactory import ClientError
from pynamodb.attributes import (
    MapAttribute,
    UnicodeAttribute,
    ListAttribute,
    NumberAttribute,
)
from pynamodb_attributes import (
    IntegerAttribute,
    TimedeltaAttribute,
)

from motor.motor_asyncio import AsyncIOMotorClient
from pymonad.maybe import Maybe, Nothing, Just
from pynamodb.models import Model

T = TypeVar("T")

ssm = boto3.client("ssm")


def get_ssm(name, with_decryption=False):
    print(f"getting ssm: {name}")
    try:
        ret = ssm.get_parameter(Name=name, WithDecryption=with_decryption)["Parameter"][
            "Value"
        ]
        print(f"got ssm value of length: {len(ret)}")
        return ret
    except ClientError as e:
        print(f"failed to get ssm param: {name} // {e}")


print("orig mongo")
mongodb_uri = env.get("MONGODB_URI", None)
if not mongodb_uri:
    print("alt mongo")
    mongodb_uri = get_ssm(f"{env.pNamePrefix}-mongodb-uri", with_decryption=True)
mongo_client = AsyncIOMotorClient(mongodb_uri)
mongo = mongo_client[mongodb_uri.rsplit("/")[-1].rsplit("?")[0]]

_eq = lambda v: {"$eq": v}


def attrdict(f):
    async def inner(*args, **kwargs):
        retval = await f(*args, **kwargs)
        if type(retval) is dict:
            return AttrDict(retval)
        return retval

    return inner


@attrdict
async def find_user(data):
    if "_id" in data:
        return await mongo.users.find_one({"_id": _eq(data["_id"])})
    return await mongo.users.find_one({"s": _eq(data.get("s", None))})


async def user_roles(uid):
    roles_all = await mongo.roles.find({"uids": uid}).to_list(None)
    roles = list([r["role"] for r in (roles_all if roles_all is not None else [])])
    return roles


# async def has_role(role_name, uid):
#     return await mongo.roles.find_one({'uids': uid, 'role': {'$eq': role_name}}) is not None


async def get_user_by_id(uid, db_inst=mongo):
    return await find_user({"_id": uid})


async def has_role(uid, role, db_inst=mongo):
    # check the user exists first
    if (await get_user_by_id(uid, db_inst=db_inst)) is None:
        return False

    if (
        role == "user"
    ):  # user role is special and generic, provided user exists this is always true
        return True

    if await db_inst.roles.find_one({"uids": uid, "role": {"$eq": role}}) is None:
        return False  # if we can't find the role

    return True


async def find_session_id(uid, session_id):
    return await mongo.auth_session_ids.find_one({"uid": uid, "session_id": session_id})


#
# pynamodb
#


def gen_id(prefix="", length=13):
    return f"{prefix}{str(uuid.uuid4())[:length]}"


def gen_table_name(name):
    return f"{env.pNamePrefix}-{name}-ddb"


class DefMeta:
    region = env.AWS_REGION


class ModelEncoder(json.JSONEncoder):
    def default(self, obj):
        if hasattr(obj, "attribute_values"):
            return obj.attribute_values
        elif isinstance(obj, datetime.datetime):
            return obj.isoformat()
        return json.JSONEncoder.default(self, obj)


class BaseModel(Model):
    @classmethod
    def get_or(cls, *args, default=None):
        if default is None:
            raise Exception("must provide a default")
        try:
            return super().get(*args)
        except super().DoesNotExist as e:
            return default

    @classmethod
    def get_maybe(cls: T, *args) -> Maybe[T]:
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


class LookupTypes(Enum):
    STRING = "str"  # , UnicodeAttribute)
    NUMBER = "num"  # , NumberAttribute)
    INTEGER = "int"  # , IntegerAttribute)
    LIST = "list"  # , ListAttribute)
    MAP = "map"  # , MapAttribute)


def maybe_from_none(v: Union[None, T]) -> Maybe[T]:
    return Nothing if v is None else Just(v)


class LookupPointer(MapAttribute):
    t = UnicodeAttribute()
    v_str = UnicodeAttribute(null=True)
    v_num = NumberAttribute(null=True)
    v_int = IntegerAttribute(null=True)
    v_td = TimedeltaAttribute(null=True)
    v_strs = ListAttribute(null=True)  # type: ListAttribute[str]

    def get_str(self):
        return maybe_from_none(self.v_str)

    def get_num(self):
        return maybe_from_none(self.v_num)

    def get_int(self):
        return maybe_from_none(self.v_int)

    def get_td(self):
        return maybe_from_none(self.v_td)

    def get_strs(self):
        return maybe_from_none(self.v_strs)


class LookupModel(BaseModel):
    class Meta(DefMeta):
        table_name = gen_table_name("lookups")

    lookup_key = UnicodeAttribute(hash_key=True)
    value = LookupPointer()

    @classmethod
    def from_kv(cls, k, v):
        return cls(
            lookup_key=k, value=LookupPointer(t=LookupTypes.STRING.value, v_str=v)
        )


def lookup_indirect(cls: BaseModel, key: str):
    return LookupModel.get_maybe(key).bind(lambda v: v.get_str()).bind(cls.get_maybe)
