import pytest

from time import time

from attrdict.dictionary import AttrDict

from flux.db import GenLookup, indirect


def test_lookup_model():
    LOOKING_FOR = str(time())
    l1 = GenLookup.from_kv("key1", LOOKING_FOR)
    l1.save()
    print(l1)
    l1_re = GenLookup.get("key1")
    print(l1_re)
    assert l1_re is not None

    GenLookup.from_kv("key2", "key1").save()
    got = indirect([], AttrDict(value="key2"), GenLookup)
    print(got.value)
    print(dir(got))

    g0 = GenLookup.get("key2")
    assert g0 is not None

    g1 = GenLookup.get_maybe("key2")
    assert g1.is_just()
    g1_1 = g1.bind(lambda l: l.value.get_str())
    print(g1_1)
    assert g1_1.is_just()
    return True
