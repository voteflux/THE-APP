import sys

sys.path.insert(0, "/opt/deps")
sys.path.insert(0, "/opt")

import os
from attrdict import AttrDict
from collections import defaultdict


def set_default(env_key, default_val):
    os.environ[env_key] = os.environ.get(env_key, default_val)


set_default("pNamePrefix", "flux-api-local-dev")


env = AttrDict(
    os.environ
)
