from time import time
from flux.db import LookupModel


async def test_lookup_model():
    LOOKING_FOR = str(time())
    LookupModel.from_kv("key1", LOOKING_FOR).save()
    return True
