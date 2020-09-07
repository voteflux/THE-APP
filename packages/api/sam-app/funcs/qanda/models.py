import json
import datetime

from pymonad.maybe import Maybe
from pynamodb.indexes import GlobalSecondaryIndex, AllProjection
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, BooleanAttribute, UTCDateTimeAttribute, ListAttribute, MapAttribute
from attrdict import AttrDict

from flux import env
from flux.utils import d_get, d_remove
from flux.pynamodb import BaseModel


def gen_table_name(name):
    return f"{env.pNamePrefix}-{name}"


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
