import sys

sys.path.insert(0, '/opt/deps')
sys.path.insert(0, '/opt')

import os
from attrdict import AttrDict

env = AttrDict(os.environ)
