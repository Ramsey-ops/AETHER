"""Public forex RSS feeds (Part 3A). No API key/quota — these are the
"public / institutional forex RSS feeds" leg of the brief. Verified working
feed URLs (2026-08): ForexLive's successor domain investinglive.com, and
FXStreet's `/rss` route (`/news/feed` on that domain serves an HTML page,
not XML — don't use it).

Feeds can go down or change shape without warning; a parse failure on one
feed must not take down the other, so each is fetched and parsed
independently and failures degrade to "this source contributed nothing,"
never a crash or fabricated headline.
"""

import re
import time
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Optional, Protocol
from xml.etree import ElementTree

import httpx

from app.services.news_types import RawNewsItem

_FEEDS = [
    ("ForexLive", "https://investinglive.com/feed/news/"),
    ("FXStreet", "https://www.fxstreet.com/rss"),
]

_TAG_RE = re.compile(r"<[^>]+>")


class RssNewsClient(Protocol):
    def get_news(self) -> Optional[list[RawNewsItem]]: ...


def _strip_html(text: str) -> str:
    return _TAG_RE.sub("", text).strip()


def _parse_pub_date(raw: Optional[str]) -> datetime:
    if raw:
        try:
            dt = parsedate_to_datetime(raw)
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except (TypeError, ValueError):
            pass
    return datetime.now(timezone.utc)


def _fetch_feed(name: str, url: str) -> list[RawNewsItem]:
    try:
        res = httpx.get(url, timeout=8.0, headers={"User-Agent": "AetherNewsBot/1.0"})
        res.raise_for_status()
        root = ElementTree.fromstring(res.content)
        items: list[RawNewsItem] = []
        for item in root.findall("./channel/item")[:25]:
            title = (item.findtext("title") or "").strip()
            if not title:
                continue
            description = item.findtext("description") or ""
            items.append(
                RawNewsItem(
                    text=title,
                    source=name,
                    publishedAtUTC=_parse_pub_date(item.findtext("pubDate")),
                    url=(item.findtext("link") or None),
                    summary=_strip_html(description)[:400] or None,
                )
            )
        return items
    except (httpx.HTTPError, ElementTree.ParseError) as e:
        print(f"[news_rss] {name} fetch failed: {e}")
        return []


class LiveRssNewsClient:
    _CACHE_TTL_SECONDS = 300

    def __init__(self):
        self._cached_at: Optional[float] = None
        self._cached_result: Optional[list[RawNewsItem]] = None

    def get_news(self) -> Optional[list[RawNewsItem]]:
        if (
            self._cached_result is not None
            and self._cached_at is not None
            and (time.monotonic() - self._cached_at) < self._CACHE_TTL_SECONDS
        ):
            return self._cached_result

        collected: list[RawNewsItem] = []
        for name, url in _FEEDS:
            collected.extend(_fetch_feed(name, url))

        result = collected or None
        if result is not None:
            self._cached_result = result
            self._cached_at = time.monotonic()
        return result if result is not None else self._cached_result


def create_rss_news_client() -> RssNewsClient:
    return LiveRssNewsClient()
