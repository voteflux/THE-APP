
import handlers as h


async def test_get_all():
    ret = await h.get_all({}, {})
    assert ret is not None
