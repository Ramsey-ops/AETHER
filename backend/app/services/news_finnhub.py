"""Finnhub forex news socket (Part 3A). Free tier: ~60 calls/min, real
headlines with no sentiment attached — Finnhub doesn't score sentiment on
this endpoint, so RawNewsItem.sentiment* stays None here; the aggregator
leaves it to Alpha Vantage/Marketaux or the AI interpreter, never guesses.
"""

import time
from datetime import datetime, timezone
from typing import Optional, Protocol

import httpx

from app.config import settings
from app.services.news_types import RawNewsItem

FINNHUB_BASE_URL = "https://finnhub.io/api/v1"


class FinnhubNewsClient(Protocol):
    def get_news(self) -> Optional[list[RawNewsItem]]: ...


class NotConfiguredFinnhubNewsClient:
    def get_news(self) -> Optional[list[RawNewsItem]]:
        return None


class LiveFinnhubNewsClient:
    _CACHE_TTL_SECONDS = 300

    def __init__(self, api_key: str):
        self._api_key = api_key
        self._cached_at: Optional[float] = None
        self._cached_result: Optional[list[RawNewsItem]] = None

    def get_news(self) -> Optional[list[RawNewsItem]]:
        if (
            self._cached_result is not None
            and self._cached_at is not None
            and (time.monotonic() - self._cached_at) < self._CACHE_TTL_SECONDS
        ):
            return self._cached_result

        result = self._fetch()
        if result is not None:
            self._cached_result = result
            self._cached_at = time.monotonic()
        return result if result is not None else self._cached_result

    def _fetch(self) -> Optional[list[RawNewsItem]]:
        try:
            res = httpx.get(
                f"{FINNHUB_BASE_URL}/news",
                params={"category": "forex", "token": self._api_key},
                timeout=8.0,
            )
            res.raise_for_status()
            data = res.json()
            if not isinstance(data, list):
                print(f"[news_finnhub] unexpected response shape: {data}")
                return None
            items = [self._parse(item) for item in data if item.get("headline")]
            return items[:25]
        except (httpx.HTTPError, ValueError, KeyError) as e:
            print(f"[news_finnhub] fetch failed: {e}")
            return None

    def _parse(self, item: dict) -> RawNewsItem:
        ts = item.get("datetime")
        published = (
            datetime.fromtimestamp(ts, tz=timezone.utc) if ts else datetime.now(timezone.utc)
        )
        return RawNewsItem(
            text=item.get("headline", ""),
            source="Finnhub",
            publishedAtUTC=published,
            url=item.get("url") or None,
            summary=item.get("summary") or None,
        )


def create_finnhub_news_client() -> FinnhubNewsClient:
    if settings.finnhub_api_key:
        return LiveFinnhubNewsClient(settings.finnhub_api_key)
    return NotConfiguredFinnhubNewsClient()
