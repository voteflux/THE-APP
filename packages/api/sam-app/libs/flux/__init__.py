import sys

sys.path.insert(0, '/opt/deps')
sys.path.insert(0, '/opt')

import os
from attrdict import AttrDict

env = AttrDict(dict(
    pTablePrefix="dev-table-prefix",
    pNamePrefix="flux-api-sam-local-dev",
    **os.environ
))
