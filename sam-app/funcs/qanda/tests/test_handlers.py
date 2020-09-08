# import json
# import logging
# import os
# logging.warning(json.dumps(dict(**os.environ), indent=2))
from attrdict.dictionary import AttrDict

import qanda.handlers as h


def test_get_all():
    ret = h.get_all({}, {})
    assert ret is not None


def test_get_qs():
    qs = h.get_all_raw({}, {})['questions']
    for q in qs:
        assert "question" in h.get_question_raw(AttrDict(pathParameters=q), {})

