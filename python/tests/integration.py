# SPDX-License-Identifier: AGPL-3.0-or-later
"""Executed by the Rust ABI integration test against a virtual service."""
import sys
from canharbor import Client, CanHarborError

runtime, library = sys.argv[1:]
with Client(runtime, library=library) as first, Client(runtime, library=library) as other:
    assert first.devices()["devices"]
    session = first.create("virtual:0", active=True)["id"]
    acquired = first.acquire(session)
    generation = acquired["generation"]
    assert isinstance(generation, str)
    try:
        other.acquire(session)
        raise AssertionError("second client acquired an occupied lease")
    except CanHarborError as error:
        assert error.status == 5
        assert error.response["http_status"] == 409
    first.start(session, generation)
    frame = {"kind": "classic_data", "id": 291, "data_hex": "0102"}
    one = first.submit(session, generation, request_id="python-once", frame=frame)
    two = first.submit(session, generation, request_id="python-once", frame=frame)
    assert one["receipt"] == two["receipt"]
    assert one["confirmation"] == "virtual_bus_accepted"
    first.renew(session, generation)
    first.stop(session, generation)
    first.release(session, generation)
    try:
        first.acquire("../bad")
        raise AssertionError("invalid path accepted")
    except ValueError:
        pass
    try:
        first.request("POST", "/sessions", {"invalid": float("nan")})
        raise AssertionError("nonfinite JSON accepted")
    except ValueError:
        pass
first.close()
try:
    first.devices()
    raise AssertionError("closed client remained usable")
except CanHarborError as error:
    assert error.status == 4
print("python virtual control passed")
