# SPDX-License-Identifier: AGPL-3.0-or-later
"""Usage: python discover.py /absolute/runtime/dir /absolute/libcanharbor_ffi."""
import json
import sys
from canharbor import Client

with Client(sys.argv[1], library=sys.argv[2]) as client:
    print(json.dumps(client.devices(), indent=2))
