"""News intelligence pipeline (Part 3A):

  Finnhub + Alpha Vantage + Marketaux + RSS
      -> normalize (RawNewsItem)
      -> currency/asset identification
      -> dedup (fuzzy title match within a time window)
      -> timestamp alignment (time-ago computed fresh on every call)
      -> impact classification (rule-based: high/medium/low)
      -> Headline[]

Every source is optional; whichever have keys configured contribute, and
`sourcesConnected` reports exactly which ones did on THIS call — no source
is required for the pipeline to run, and none is silently assumed present.

Scope is deliberately narrow: only items that mention a currency behind one
of the app's four watchlist pairs (XAUUSD, EURUSD, USDJPY, GBPUSD) survive —
that matches the News screen's existing promise, "Only events touching your
four pairs," and keeps the (paid, rate-limited) AI interpretation pass in
news_interpreter.py from being run over irrelevant stock/crypto stories.
"""

import re
from dataclasses import dataclass
from datetime import datetime, timezone
from difflib import SequenceMatcher

from app.models import CurrencySentiment, Headline
from app.services.news_finnhub import create_finnhub_news_client
from app.services.news_marketaux import create_marketaux_news_client
from app.services.news_rss import create_rss_news_client
from app.services.news_sentiment import MOCK_HEADLINES, MOCK_SENTIMENT, create_news_sentiment_client
from app.services.news_types import RawNewsItem

_CURRENCY_KEYWORDS: dict[str, list[str]] = {
    "USD": ["usd", "dollar", "greenback", "fed ", "federal reserve", "fomc", "powell", "u.s.", "nonfarm", "nfp"],
    "EUR": ["eur", "euro", "ecb", "eurozone", "lagarde", "euro area"],
    "GBP": ["gbp", "pound", "sterling", "boe", "bank of england", "bailey"],
    "JPY": ["jpy", "yen", "boj", "bank of japan", "ueda"],
    "XAU": ["gold", "xau", "bullion"],
}

_USD_CROSS_PAIR = {"EUR": "EURUSD", "GBP": "GBPUSD", "JPY": "USDJPY"}
_ALL_USD_PAIRS = ["EURUSD", "GBPUSD", "USDJPY"]

_HIGH_IMPACT_TERMS = [
    "cpi", "nfp", "nonfarm", "rate decision", "interest rate", "fomc",
    "gdp", "inflation", "jobs report", "rate cut", "rate hike", "payrolls",
]
_MEDIUM_IMPACT_TERMS = [
    "pmi", "retail sales", "trade balance", "speech", "speaks",
    "unemployment", "confidence", "housing", "manufacturing", "auction",
]

_DEDUP_TIME_WINDOW_MINUTES = 90
_DEDUP_SIMILARITY_THRESHOLD = 0.72
_MAX_HEADLINES = 20


def _tag_currencies(text: str) -> list[str]:
    lowered = text.lower()
    return [c for c, keywords in _CURRENCY_KEYWORDS.items() if any(kw in lowered for kw in keywords)]


def _affected_assets(currencies: list[str]) -> list[str]:
    currency_set = set(currencies)
    assets: list[str] = list(currencies)

    if currency_set == {"USD"}:
        assets.extend(_ALL_USD_PAIRS)
    if "XAU" in currency_set:
        assets.append("XAUUSD")
    for currency, pair in _USD_CROSS_PAIR.items():
        if currency in currency_set and "USD" in currency_set:
            assets.append(pair)

    seen: set[str] = set()
    ordered: list[str] = []
    for a in assets:
        if a not in seen:
            seen.add(a)
            ordered.append(a)
    return ordered


def _classify_impact(text: str) -> str:
    lowered = text.lower()
    if any(term in lowered for term in _HIGH_IMPACT_TERMS):
        return "high"
    if any(term in lowered for term in _MEDIUM_IMPACT_TERMS):
        return "medium"
    return "low"


def _normalize_for_dedup(text: str) -> str:
    return re.sub(r"[^a-z0-9 ]", "", text.lower()).strip()


def _time_ago(published: datetime, now: datetime) -> str:
    minutes = max(0, int((now - published).total_seconds() // 60))
    if minutes < 60:
        return f"{minutes}m ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours}h ago"
    return f"{hours // 24}d ago"


def _dedup(items: list[RawNewsItem]) -> list[RawNewsItem]:
    """Same story from two providers within ~90 minutes of each other, with
    a near-identical title, keeps only the first (the list is pre-sorted
    newest-first, so "first" is also "most recent report of it")."""
    kept: list[RawNewsItem] = []
    for item in items:
        norm = _normalize_for_dedup(item.text)
        if any(
            abs((item.publishedAtUTC - existing.publishedAtUTC).total_seconds()) / 60 <= _DEDUP_TIME_WINDOW_MINUTES
            and SequenceMatcher(None, norm, _normalize_for_dedup(existing.text)).ratio() >= _DEDUP_SIMILARITY_THRESHOLD
            for existing in kept
        ):
            continue
        kept.append(item)
    return kept


def _derive_sentiment(headlines: list[Headline]) -> list[CurrencySentiment]:
    """Fallback aggregate sentiment when Alpha Vantage isn't configured —
    averages whatever per-headline sentiment scores exist (Marketaux, or
    the conservative Neutral/0.0 default for sources with no scoring)."""
    totals: dict[str, list[float]] = {}
    for h in headlines:
        for asset in h.affectedAssets:
            if asset in _CURRENCY_KEYWORDS:
                totals.setdefault(asset, []).append(h.sentimentScore)
    return [
        CurrencySentiment(currency=currency, score=round(sum(scores) / len(scores), 2))
        for currency, scores in totals.items()
        if scores
    ]


@dataclass
class AggregatedNews:
    headlines: list[Headline]
    sentiment: list[CurrencySentiment]
    sourcesConnected: list[str]


class NewsAggregator:
    def __init__(self):
        self._finnhub = create_finnhub_news_client()
        self._marketaux = create_marketaux_news_client()
        self._rss = create_rss_news_client()
        self._alpha_vantage = create_news_sentiment_client()

    def get_news(self) -> AggregatedNews:
        now = datetime.now(timezone.utc)
        raw_items: list[RawNewsItem] = []
        sources_connected: list[str] = []

        av_result = self._alpha_vantage.get_news()
        if av_result and av_result.items:
            raw_items.extend(av_result.items)
            sources_connected.append("Alpha Vantage")

        finnhub_items = self._finnhub.get_news()
        if finnhub_items:
            raw_items.extend(finnhub_items)
            sources_connected.append("Finnhub")

        marketaux_items = self._marketaux.get_news()
        if marketaux_items:
            raw_items.extend(marketaux_items)
            sources_connected.append("Marketaux")

        rss_items = self._rss.get_news()
        if rss_items:
            raw_items.extend(rss_items)
            sources_connected.append("RSS (ForexLive/FXStreet)")

        if not raw_items:
            return AggregatedNews(headlines=list(MOCK_HEADLINES), sentiment=list(MOCK_SENTIMENT), sourcesConnected=[])

        tagged = [(item, _tag_currencies(f"{item.text} {item.summary or ''}")) for item in raw_items]
        tagged = [(item, currencies) for item, currencies in tagged if currencies]
        tagged.sort(key=lambda pair: pair[0].publishedAtUTC, reverse=True)

        currencies_by_id = {id(item): currencies for item, currencies in tagged}
        deduped_items = _dedup([item for item, _ in tagged])

        headlines: list[Headline] = []
        for item in deduped_items:
            currencies = currencies_by_id[id(item)]
            impact = _classify_impact(f"{item.text} {item.summary or ''}")
            headlines.append(
                Headline(
                    text=item.text,
                    currencyTag=currencies[0],
                    sentimentLabel=item.sentimentLabel or "Neutral",
                    sentimentScore=item.sentimentScore if item.sentimentScore is not None else 0.0,
                    timeAgoLabel=_time_ago(item.publishedAtUTC, now),
                    source=item.source,
                    url=item.url,
                    summary=item.summary,
                    affectedAssets=_affected_assets(currencies),
                    impact=impact,
                )
            )

        headlines = headlines[:_MAX_HEADLINES]
        sentiment = av_result.sentiment if av_result and av_result.sentiment else _derive_sentiment(headlines)

        return AggregatedNews(headlines=headlines, sentiment=sentiment, sourcesConnected=sources_connected)


def create_news_aggregator() -> NewsAggregator:
    return NewsAggregator()
