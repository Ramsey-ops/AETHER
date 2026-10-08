"""Socket for real news headlines + sentiment (Part 2.11/2.18's news-read
input). Alpha Vantage's NEWS_SENTIMENT endpoint computes its own NLP
sentiment score per article — that's a third-party signal, not our Phase 3
trading model, so it's fair game to treat as real once a key is configured.

Free tier is ~25 requests/day, so `LiveAlphaVantageClient` caches
aggressively (15 minutes) — this is a "nice to have when configured" socket,
not something the UI depends on; `NotConfiguredNewsSentimentClient` is the
default and keeps Screen 4 fully functional with preview headlines.
"""

import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional, Protocol

import httpx

from app.config import settings
from app.models import CurrencySentiment, Headline, SentimentLabel
from app.services.news_types import RawNewsItem

ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query"

_FOREX_TICKERS = ["FOREX:USD", "FOREX:EUR", "FOREX:GBP", "FOREX:JPY"]


@dataclass
class NewsSentimentResult:
    headlines: list[Headline]
    sentiment: list[CurrencySentiment]
    # Every feed item (not just the first 6) as a source-agnostic RawNewsItem
    # so news_aggregator.py can merge it with Finnhub/Marketaux/RSS. `headlines`
    # above stays for the currency-sentiment computation this module already did.
    items: list[RawNewsItem]


class NewsSentimentClient(Protocol):
    def get_news(self) -> Optional[NewsSentimentResult]: ...


class NotConfiguredNewsSentimentClient:
    def get_news(self) -> Optional[NewsSentimentResult]:
        return None


def _normalize_label(raw: str) -> SentimentLabel:
    if "Bullish" in raw:
        return "Bullish"
    if "Bearish" in raw:
        return "Bearish"
    return "Neutral"


def _time_ago(time_published: str, now: datetime) -> str:
    # Alpha Vantage format: "20230410T013500"
    published = datetime.strptime(time_published, "%Y%m%dT%H%M%S").replace(tzinfo=timezone.utc)
    minutes = max(0, int((now - published).total_seconds() // 60))
    if minutes < 60:
        return f"{minutes}m ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours}h ago"
    return f"{hours // 24}d ago"


class LiveAlphaVantageClient:
    _CACHE_TTL_SECONDS = 900

    def __init__(self, api_key: str):
        self._api_key = api_key
        self._cached_at: Optional[float] = None
        self._cached_result: Optional[NewsSentimentResult] = None

    def get_news(self) -> Optional[NewsSentimentResult]:
        if self._cached_result and self._cached_at and (time.monotonic() - self._cached_at) < self._CACHE_TTL_SECONDS:
            return self._cached_result

        result = self._fetch()
        self._cached_result = result
        self._cached_at = time.monotonic()
        return result

    def _fetch(self) -> Optional[NewsSentimentResult]:
        try:
            res = httpx.get(
                ALPHA_VANTAGE_BASE_URL,
                params={
                    "function": "NEWS_SENTIMENT",
                    "topics": "forex",
                    "limit": 20,
                    "apikey": self._api_key,
                },
                timeout=8.0,
            )
            res.raise_for_status()
            data = res.json()
            feed = data.get("feed")
            if not feed:
                print(f"[news_sentiment] Alpha Vantage returned no feed: {data}")
                return None
            return self._parse(feed)
        except (httpx.HTTPError, ValueError, KeyError) as e:
            print(f"[news_sentiment] fetch failed: {e}")
            return None

    def _parse(self, feed: list[dict]) -> NewsSentimentResult:
        now = datetime.now(timezone.utc)
        headlines: list[Headline] = []
        items: list[RawNewsItem] = []
        currency_totals: dict[str, tuple[float, float]] = {}  # currency -> (weighted_sum, weight)

        for item in feed:
            ticker_sentiments = item.get("ticker_sentiment", [])
            fx_sentiments = [
                t for t in ticker_sentiments if t.get("ticker") in _FOREX_TICKERS
            ]
            for t in fx_sentiments:
                currency = t["ticker"].removeprefix("FOREX:")
                relevance = float(t.get("relevance_score", 0))
                score = float(t.get("ticker_sentiment_score", 0))
                total, weight = currency_totals.get(currency, (0.0, 0.0))
                currency_totals[currency] = (total + score * relevance, weight + relevance)

            published = (
                datetime.strptime(item["time_published"], "%Y%m%dT%H%M%S").replace(tzinfo=timezone.utc)
                if item.get("time_published")
                else now
            )
            items.append(
                RawNewsItem(
                    text=item.get("title", ""),
                    source="Alpha Vantage",
                    publishedAtUTC=published,
                    url=item.get("url") or None,
                    summary=item.get("summary") or None,
                    sentimentLabel=_normalize_label(item.get("overall_sentiment_label", "Neutral")),
                    sentimentScore=float(item.get("overall_sentiment_score", 0)),
                )
            )

            if len(headlines) < 6:
                top_tag = max(fx_sentiments, key=lambda t: float(t.get("relevance_score", 0)), default=None)
                headlines.append(
                    Headline(
                        text=item.get("title", ""),
                        currencyTag=top_tag["ticker"].removeprefix("FOREX:") if top_tag else "FX",
                        sentimentLabel=_normalize_label(item.get("overall_sentiment_label", "Neutral")),
                        sentimentScore=float(item.get("overall_sentiment_score", 0)),
                        timeAgoLabel=_time_ago(item["time_published"], now) if item.get("time_published") else "recently",
                        source="Alpha Vantage",
                        url=item.get("url") or None,
                        summary=item.get("summary") or None,
                    )
                )

        sentiment = [
            CurrencySentiment(currency=currency, score=round(total / weight, 2))
            for currency, (total, weight) in currency_totals.items()
            if weight > 0
        ]

        return NewsSentimentResult(headlines=headlines, sentiment=sentiment, items=items)


def create_news_sentiment_client() -> NewsSentimentClient:
    if settings.alpha_vantage_api_key:
        return LiveAlphaVantageClient(settings.alpha_vantage_api_key)
    return NotConfiguredNewsSentimentClient()


MOCK_HEADLINES: list[Headline] = [
    Headline(
        text="Dollar slips as traders trim rate-cut bets ahead of CPI",
        currencyTag="USD",
        sentimentLabel="Bearish",
        sentimentScore=0.42,
        timeAgoLabel="32m ago",
        source="Preview",
        affectedAssets=["USD", "EURUSD", "USDJPY"],
        impact="medium",
    ),
    Headline(
        text="Gold holds near record as real yields ease",
        currencyTag="XAU",
        sentimentLabel="Bullish",
        sentimentScore=0.57,
        timeAgoLabel="1h ago",
        source="Preview",
        affectedAssets=["XAU", "XAUUSD"],
        impact="low",
    ),
]

MOCK_SENTIMENT: list[CurrencySentiment] = [
    CurrencySentiment(currency="USD", score=-0.31),
    CurrencySentiment(currency="EUR", score=0.04),
    CurrencySentiment(currency="XAU", score=0.46),
]
