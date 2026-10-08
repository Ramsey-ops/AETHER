"""Real session-timing computation (Part 2.10, FR-TIME series).

Unlike the AI Decision Fusion socket, session open/close/overlap times are
public, fixed facts (not a model prediction) — so this is genuinely real,
not a Mock* stand-in. What's still deferred to Phase 3 is *whether a
strategy setup is forming*; this only ever reasons about session clock
time.

Session hours are UTC approximations of standard market hours and don't
account for regional daylight-saving shifts — accurate enough for "when do
I come back," not for order execution.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Protocol

from app.models import ReturnRecommendation, SessionInfo

SESSION_HOURS_UTC: dict[str, tuple[int, int]] = {
    "Tokyo": (0, 9),
    "London": (8, 17),
    "New York": (13, 22),
}


def _is_open(hours: tuple[int, int], now: datetime) -> bool:
    open_h, close_h = hours
    return open_h <= now.hour < close_h


def _next_boundary(hour: int, now: datetime) -> datetime:
    candidate = now.replace(hour=hour, minute=0, second=0, microsecond=0)
    if candidate <= now:
        candidate += timedelta(days=1)
    return candidate


def _format_countdown(delta: timedelta) -> str:
    total_minutes = max(0, int(delta.total_seconds() // 60))
    hours, minutes = divmod(total_minutes, 60)
    return f"{hours}h {minutes}m" if hours else f"{minutes}m"


class MarketTimingClient(Protocol):
    def get_sessions(self) -> list[SessionInfo]: ...
    def get_current_session_label(self) -> str: ...
    def get_return_recommendation(self) -> ReturnRecommendation: ...


@dataclass
class RealMarketTimingClient:
    def get_sessions(self) -> list[SessionInfo]:
        now = datetime.now(timezone.utc)
        sessions = []
        for name, (open_h, close_h) in SESSION_HOURS_UTC.items():
            is_open = _is_open((open_h, close_h), now)
            opens_in_label = None
            if not is_open:
                opens_in_label = _format_countdown(_next_boundary(open_h, now) - now)
            sessions.append(
                SessionInfo(
                    name=name,
                    opensAtUTC=f"{open_h:02d}:00",
                    isOpen=is_open,
                    opensInLabel=opens_in_label,
                )
            )
        return sessions

    def get_current_session_label(self) -> str:
        now = datetime.now(timezone.utc)
        open_now = [
            name for name, hours in SESSION_HOURS_UTC.items() if _is_open(hours, now)
        ]
        if len(open_now) >= 2:
            return " / ".join(open_now) + " Overlap"
        if open_now:
            return f"{open_now[0]} Session"
        return "Between Sessions"

    def get_return_recommendation(self) -> ReturnRecommendation:
        now = datetime.now(timezone.utc)
        candidates: list[tuple[datetime, str, str]] = []
        for name, (open_h, close_h) in SESSION_HOURS_UTC.items():
            candidates.append((_next_boundary(open_h, now), name, "opens"))
            candidates.append((_next_boundary(close_h, now), name, "closes"))
        next_time, session, action = min(candidates, key=lambda c: c[0])

        if session == "New York" and action == "opens":
            reason = (
                "London-New York overlap begins — typically the day's "
                "highest-liquidity window."
            )
        elif session == "Tokyo" and action == "opens":
            reason = "Tokyo session opens — the first session of the trading day."
        else:
            reason = f"{session} session {action}."

        return ReturnRecommendation(
            returnAtUTC=next_time.strftime("%H:%M"),
            reason=reason,
        )


# Kept for reference/tests; RealMarketTimingClient replaced this as the
# router's default now that real session computation exists.
class MockMarketTimingClient:
    def get_sessions(self) -> list[SessionInfo]:
        return [
            SessionInfo(name="Tokyo", opensAtUTC="00:00", isOpen=False),
            SessionInfo(
                name="London",
                opensAtUTC="09:00",
                isOpen=False,
                opensInLabel="2h 14m",
            ),
            SessionInfo(name="New York", opensAtUTC="14:00", isOpen=False),
        ]
