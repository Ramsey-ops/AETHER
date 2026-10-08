"""Shared shape every news source client normalizes into (Part 3A).

Each source (Finnhub, Alpha Vantage, Marketaux, RSS) knows nothing about the
others. news_aggregator.py is the only place that merges, dedups, tags, and
classifies these — keeping every source client a thin, swappable socket.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class RawNewsItem:
    text: str
    source: str
    publishedAtUTC: datetime
    url: Optional[str] = None
    summary: Optional[str] = None
    # Only set when the source itself computes sentiment (Alpha Vantage,
    # Marketaux). Left None for sources that don't (Finnhub, RSS) — the
    # aggregator must not invent a score for those.
    sentimentLabel: Optional[str] = None
    sentimentScore: Optional[float] = None
