"""Real market data — Twelve Data (https://twelvedata.com/), chosen for
Phase 2 (free tier: 800 req/day, 8/min; covers FX majors + XAU/USD across
every timeframe Screen 2 needs).

`get_quote()` returns None whenever real data isn't available — no API key
configured, a transient HTTP/API error, an unrecognized symbol — and
callers must render that as DATA_UNAVAILABLE. Never invent a price.
"""

import time
from dataclasses import dataclass
from typing import Optional, Protocol

import httpx

from app.config import settings

TWELVE_DATA_BASE_URL = "https://api.twelvedata.com"

# Our app uses plain symbols ("EURUSD"); Twelve Data wants "EUR/USD".
_SYMBOL_MAP = {
    "EURUSD": "EUR/USD",
    "GBPUSD": "GBP/USD",
    "USDJPY": "USD/JPY",
    "XAUUSD": "XAU/USD",
}

# Screen 2 timeframe tabs -> Twelve Data's `interval` values.
_INTERVAL_MAP = {
    "1H": "1h",
    "4H": "4h",
    "1D": "1day",
    "1W": "1week",
}

_CANDLE_COUNT = 30


@dataclass
class Quote:
    price: float
    changePercent: float


@dataclass
class Candle:
    timeUTC: str
    close: float


class MarketDataClient(Protocol):
    def get_quote(self, symbol: str) -> Optional[Quote]: ...
    def get_candles(self, symbol: str, timeframe: str) -> Optional[list[Candle]]: ...


class NotConfiguredMarketDataClient:
    """Used whenever TWELVE_DATA_API_KEY isn't set. Explicit no-op rather
    than a silent failure buried in the live client — makes the
    "not configured" state easy to find in the code."""

    def get_quote(self, symbol: str) -> Optional[Quote]:
        return None

    def get_candles(self, symbol: str, timeframe: str) -> Optional[list[Candle]]:
        return None


class LiveTwelveDataClient:
    _CACHE_TTL_SECONDS = 30

    def __init__(self, api_key: str):
        self._api_key = api_key
        self._quote_cache: dict[str, tuple[float, Optional[Quote]]] = {}
        self._candle_cache: dict[str, tuple[float, Optional[list[Candle]]]] = {}

    def get_quote(self, symbol: str) -> Optional[Quote]:
        cached = self._quote_cache.get(symbol)
        if cached and (time.monotonic() - cached[0]) < self._CACHE_TTL_SECONDS:
            return cached[1]

        quote = self._fetch_quote(symbol)
        self._quote_cache[symbol] = (time.monotonic(), quote)
        return quote

    def get_candles(self, symbol: str, timeframe: str) -> Optional[list[Candle]]:
        cache_key = f"{symbol}:{timeframe}"
        cached = self._candle_cache.get(cache_key)
        if cached and (time.monotonic() - cached[0]) < self._CACHE_TTL_SECONDS:
            return cached[1]

        candles = self._fetch_candles(symbol, timeframe)
        self._candle_cache[cache_key] = (time.monotonic(), candles)
        return candles

    def _fetch_quote(self, symbol: str) -> Optional[Quote]:
        td_symbol = _SYMBOL_MAP.get(symbol)
        if not td_symbol:
            return None
        try:
            res = httpx.get(
                f"{TWELVE_DATA_BASE_URL}/quote",
                params={"symbol": td_symbol, "apikey": self._api_key},
                timeout=5.0,
            )
            res.raise_for_status()
            data = res.json()
            if data.get("status") == "error" or "close" not in data:
                print(f"[market_data] Twelve Data error for {symbol}: {data}")
                return None
            return Quote(
                price=float(data["close"]),
                changePercent=float(data.get("percent_change", 0.0)),
            )
        except (httpx.HTTPError, ValueError, KeyError) as e:
            print(f"[market_data] fetch failed for {symbol}: {e}")
            return None

    def _fetch_candles(self, symbol: str, timeframe: str) -> Optional[list[Candle]]:
        td_symbol = _SYMBOL_MAP.get(symbol)
        td_interval = _INTERVAL_MAP.get(timeframe)
        if not td_symbol or not td_interval:
            return None
        try:
            res = httpx.get(
                f"{TWELVE_DATA_BASE_URL}/time_series",
                params={
                    "symbol": td_symbol,
                    "interval": td_interval,
                    "outputsize": _CANDLE_COUNT,
                    "apikey": self._api_key,
                },
                timeout=5.0,
            )
            res.raise_for_status()
            data = res.json()
            values = data.get("values")
            if data.get("status") == "error" or not values:
                print(f"[market_data] Twelve Data time_series error for {symbol}: {data}")
                return None
            candles = [
                Candle(timeUTC=v["datetime"], close=float(v["close"])) for v in values
            ]
            candles.reverse()  # Twelve Data returns newest-first.
            return candles
        except (httpx.HTTPError, ValueError, KeyError) as e:
            print(f"[market_data] candle fetch failed for {symbol}: {e}")
            return None


def create_market_data_client() -> MarketDataClient:
    if settings.twelve_data_api_key:
        return LiveTwelveDataClient(settings.twelve_data_api_key)
    return NotConfiguredMarketDataClient()
