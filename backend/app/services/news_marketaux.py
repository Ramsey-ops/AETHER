"""Marketaux forex/currency news socket (Part 3A). Free tier is ~100
requests/day, so `LiveMarketauxNewsClient` caches for 20 minutes. Marketaux
tags each article with per-entity sentiment (-1..1) — that's Marketaux's own
NLP signal, a third-party FACT field, not our Phase 3 trading model.

Parsing is defensive throughout: any missing/renamed field from Marketaux
degrades to "skip this article" or "no sentiment," never a fabricated value.
"""

import time
from datetime import datetime, timezone
from typing import Optional, Protocol

import httpx

from app.config import settings
from app.services.news_types import RawNewsItem

MARKETAUX_BASE_URL = "https://api.marketaux.com/v1/news/all"


class MarketauxNewsClient(Protocol):
    def get_news(self) -> Optional[list[RawNewsItem]]: ...


class NotConfiguredMarketauxNewsClient:
    def get_news(self) -> Optional[list[RawNewsItem]]:
        return None


def _parse_published(raw: Optional[str]) -> datetime:
    if raw:
        try:
            return datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except ValueError:
            pass
    return datetime.now(timezone.utc)


def _average_sentiment(entities: list[dict]) -> Optional[float]:
    scores = [
        float(e["sentiment_score"])
        for e in entities
        if isinstance(e, dict) and e.get("sentiment_score") is not None
    ]
    if not scores:
        return None
    return sum(scores) / len(scores)


def _label_for_score(score: Optional[float]) -> Optional[str]:
    if score is None:
        return None
    if score > 0.1:
        return "Bullish"
    if score < -0.1:
        return "Bearish"
    return "Neutral"


class LiveMarketauxNewsClient:
    _CACHE_TTL_SECONDS = 1200

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
                MARKETAUX_BASE_URL,
                params={
                    "api_token": self._api_key,
                    "entity_types": "currency",
                    "language": "en",
                    "limit": 25,
                },
                timeout=8.0,
            )
            res.raise_for_status()
            data = res.json()
            articles = data.get("data")
            if not isinstance(articles, list):
                print(f"[news_marketaux] unexpected response shape: {data}")
                return None
            return [self._parse(a) for a in articles if a.get("title")]
        except (httpx.HTTPError, ValueError, KeyError) as e:
            print(f"[news_marketaux] fetch failed: {e}")
            return None

    def _parse(self, article: dict) -> RawNewsItem:
        entities = article.get("entities") or []
        score = _average_sentiment(entities)
        return RawNewsItem(
            text=article.get("title", ""),
            source="Marketaux",
            publishedAtUTC=_parse_published(article.get("published_at")),
            url=article.get("url") or None,
            summary=article.get("description") or article.get("snippet") or None,
            sentimentLabel=_label_for_score(score),
            sentimentScore=score,
        )


def create_marketaux_news_client() -> MarketauxNewsClient:
    if settings.marketaux_api_key:
        return LiveMarketauxNewsClient(settings.marketaux_api_key)
    return NotConfiguredMarketauxNewsClient()
