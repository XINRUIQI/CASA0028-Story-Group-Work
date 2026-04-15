"""
Shared async TfL API client.
Centralises auth, retries and disambiguation handling
so individual API modules don't duplicate boilerplate.
"""

from typing import Optional, Union

import httpx
from fastapi import HTTPException

from data.core.config import TFL_BASE_URL, TFL_API_KEY

_TIMEOUT = 30


async def tfl_get(
    path: str,
    params: Optional[dict] = None,
    *,
    raise_on_error: bool = True,
) -> Union[dict, list]:
    """
    GET a TfL API endpoint.

    When *raise_on_error* is False the caller gets an empty list/dict
    instead of an HTTP exception on non-200 responses – useful for
    best-effort data enrichment where missing data is acceptable.
    """
    params = params or {}
    if TFL_API_KEY:
        params["app_key"] = TFL_API_KEY

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.get(f"{TFL_BASE_URL}{path}", params=params)

        if resp.status_code == 300:
            return _handle_disambiguation(resp, client, raise_on_error)

        if resp.status_code != 200:
            if raise_on_error:
                raise HTTPException(status_code=resp.status_code, detail=resp.text)
            return [] if isinstance(resp.text, list) else {}

        return resp.json()


async def _handle_disambiguation(
    resp: httpx.Response,
    client: httpx.AsyncClient,
    raise_on_error: bool,
) -> Union[dict, list]:
    """TfL returns 300 when origin/destination is ambiguous."""
    body = resp.json()
    for key in ("fromLocationDisambiguation", "toLocationDisambiguation"):
        dis = body.get(key, {})
        options = dis.get("disambiguationOptions", [])
        if options and dis.get("matchStatus") == "list":
            uri = options[0].get("uri", "")
            if uri:
                retry = await client.get(f"{TFL_BASE_URL}{uri}")
                if retry.status_code == 200:
                    return retry.json()

    if raise_on_error:
        raise HTTPException(
            status_code=300,
            detail="TfL could not resolve origin/destination uniquely.",
        )
    return {}
