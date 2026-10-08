"""Socket for the economic calendar (Part 2.11, FR-NEWS series; Part 3A).

No commercial calendar provider was in reach for Phase 2 — TradingEconomics
and FXStreet's real feeds need a paid contract. `MockEconomicCalendarClient`
returns a fixed daily fixture and stays the fallback whenever the live
source is unavailable.

Phase 3A tried Finnhub's `/calendar/economic` first — it 403'd (premium-
gated on this account) and was dropped rather than kept as dead code.
`LiveFairEconomyCalendarClient` instead uses the public JSON feed at
nfs.faireconomy.media, the same data source ForexFactory's own calendar
widget and a large number of MT4/MT5 trading tools pull from. It needs no
API key, but it also has no formal published terms — only long-standing
community tolerance and an explicit informal rate limit ("wait five
minutes" after a burst; their own guidance is to cache for as long as a
week). This client caches for 6 hours, several times more conservative
than that guidance, and falls back to the mock fixture (per-call, not just
at startup) whenever the feed is empty, rate-limited, or unparseable.
`economicCalendarConnected` reflects whether the last attempt actually
returned real events, not whether the client is merely configured.
"""

import time
from datetime import datetime, timedelta, timezone
from typing import Optional, Protocol

import httpx

from app.models import CalendarEvent, NextHighImpact

FAIR_ECONOMY_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json"

# The feed covers every country; we only want events tagged to the four
# currencies behind the app's watchlist pairs. FairEconomy already tags
# events with a currency code directly (not a 2-letter country code).
_RELEVANT_CURRENCIES = {"USD", "EUR", "GBP", "JPY"}


def _next_occurrence(hhmm: str, now: datetime) -> datetime:
    h, m = (int(p) for p in hhmm.split(":"))
    candidate = now.replace(hour=h, minute=m, second=0, microsecond=0)
    if candidate <= now:
        candidate += timedelta(days=1)
    return candidate


def _format_countdown(delta: timedelta) -> str:
    total_minutes = max(0, int(delta.total_seconds() // 60))
    hours, minutes = divmod(total_minutes, 60)
    return f"{hours}h {minutes}m" if hours else f"{minutes}m"


class EconomicCalendarClient(Protocol):
    def get_today(self) -> list[CalendarEvent]: ...
    def get_next_high_impact(self) -> NextHighImpact | None: ...


class MockEconomicCalendarClient:
    def get_today(self) -> list[CalendarEvent]:
        return list(_EVENTS)

    def get_next_high_impact(self) -> NextHighImpact | None:
        high_impact = [e for e in _EVENTS if e.impact == "high"]
        if not high_impact:
            return None
        now = datetime.now(timezone.utc)
        event = high_impact[0]
        in_label = _format_countdown(_next_occurrence(event.timeUTC, now) - now)
        return NextHighImpact(event=event, inLabel=in_label)


_PAIRS_FOR_CURRENCY: dict[str, list[str]] = {
    "USD": ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"],
    "EUR": ["EURUSD"],
    "GBP": ["GBPUSD"],
    "JPY": ["USDJPY"],
}


def _map_fair_economy_impact(raw: object) -> str:
    if isinstance(raw, str) and raw.lower() in ("high", "medium", "low"):
        return raw.lower()
    return "low"


def _parse_fair_economy_event(e: dict, today_utc: datetime) -> Optional[tuple[CalendarEvent, datetime]]:
    try:
        currency = (e.get("country") or "").upper()
        title = e.get("title")
        raw_date = e.get("date")
        if currency not in _RELEVANT_CURRENCIES or not title or not raw_date:
            return None
        dt_utc = datetime.fromisoformat(raw_date).astimezone(timezone.utc)
        if dt_utc.date() != today_utc.date():
            return None
        forecast = e.get("forecast")
        previous = e.get("previous")
        event = CalendarEvent(
            timeUTC=dt_utc.strftime("%H:%M"),
            title=title,
            currency=currency,
            impact=_map_fair_economy_impact(e.get("impact")),
            forecast=str(forecast) if forecast not in (None, "") else None,
            previous=str(previous) if previous not in (None, "") else None,
            affectedPairs=_PAIRS_FOR_CURRENCY.get(currency, []),
        )
        return event, dt_utc
    except (KeyError, ValueError, TypeError):
        return None


class LiveFairEconomyCalendarClient:
    """Fetches today's real events from the FairEconomy/ForexFactory JSON
    feed, filters to the four watchlist currencies, and falls back to the
    mock fixture (per-call, not just at startup) whenever the feed is
    rate-limited, unreachable, or unparseable. `last_call_was_live` tells
    the router which happened, so `economicCalendarConnected` never claims
    "real" when the payload actually came from the fixture.

    The high-impact countdown is computed from the event's actual parsed
    UTC datetime (not the day-agnostic `_next_occurrence` guess the mock
    fixture needs) — a real calendar already knows exactly when today's
    next flagged event is, or that there isn't one left today.
    """

    _CACHE_TTL_SECONDS = 6 * 3600

    def __init__(self):
        self._fallback = MockEconomicCalendarClient()
        self._cached_at: Optional[float] = None
        self._cached_events: Optional[list[CalendarEvent]] = None
        self._cached_next_high_impact: Optional[NextHighImpact] = None
        self.last_call_was_live: bool = False

    def get_today(self) -> list[CalendarEvent]:
        self._ensure_fresh()
        if self._cached_events:
            return self._cached_events
        return self._fallback.get_today()

    def get_next_high_impact(self) -> Optional[NextHighImpact]:
        self._ensure_fresh()
        if self._cached_events:
            return self._cached_next_high_impact
        return self._fallback.get_next_high_impact()

    def _ensure_fresh(self) -> None:
        if (
            self._cached_events is not None
            and self._cached_at is not None
            and (time.monotonic() - self._cached_at) < self._CACHE_TTL_SECONDS
        ):
            self.last_call_was_live = True
            return

        result = self._fetch()
        if result is not None:
            self._cached_events, self._cached_next_high_impact = result
            self._cached_at = time.monotonic()
            self.last_call_was_live = True
        else:
            self.last_call_was_live = False

    def _fetch(self) -> Optional[tuple[list[CalendarEvent], Optional[NextHighImpact]]]:
        try:
            res = httpx.get(
                FAIR_ECONOMY_URL,
                timeout=10.0,
                headers={"User-Agent": "AetherApp/1.0 (personal trading assistant; syncs every 6h)"},
            )
            if res.status_code == 429:
                print("[economic_calendar] FairEconomy feed rate-limited — using preview fixture")
                return None
            res.raise_for_status()
            raw_events = res.json()
            if not isinstance(raw_events, list):
                return None

            now = datetime.now(timezone.utc)
            parsed = [
                result
                for e in raw_events
                if (result := _parse_fair_economy_event(e, now)) is not None
            ]
            if not parsed:
                return None
            parsed.sort(key=lambda pair: pair[1])
            events = [ev for ev, _ in parsed]

            next_high = None
            future_high_impact = [(ev, dt) for ev, dt in parsed if ev.impact == "high" and dt > now]
            if future_high_impact:
                ev, dt = future_high_impact[0]
                next_high = NextHighImpact(event=ev, inLabel=_format_countdown(dt - now))

            return events, next_high
        except (httpx.HTTPError, ValueError, KeyError) as e:
            print(f"[economic_calendar] FairEconomy fetch failed: {e}")
            return None


def create_economic_calendar_client() -> EconomicCalendarClient:
    return LiveFairEconomyCalendarClient()


_EVENTS: list[CalendarEvent] = [
    CalendarEvent(
        timeUTC="09:00",
        title="EU Industrial Production",
        currency="EUR",
        impact="low",
    ),
    CalendarEvent(
        timeUTC="14:30",
        title="US CPI (YoY)",
        currency="USD",
        impact="high",
        forecast="2.9%",
        previous="3.0%",
        affectedPairs=["USDJPY", "EURUSD"],
        note="Affects USDJPY and EURUSD setups. The engine holds both at WAIT until the print.",
    ),
    CalendarEvent(
        timeUTC="16:00",
        title="Crude Oil Inventories",
        currency="USD",
        impact="medium",
    ),
    CalendarEvent(
        timeUTC="19:00",
        title="FOMC Member Speech",
        currency="USD",
        impact="medium",
    ),
]
