"""Socket for the TradingView-synced Watchlist service (Part 2.4, FR-TV-003).

The Morning Briefing only needs a condensed preview (top pairs + status);
the full watchlist lives on Screen 3. `MockWatchlistClient` returns the same
four instruments as the approved Claude Design reference.
"""

from typing import Protocol

from app.models import PairSummary


class WatchlistClient(Protocol):
    def get_preview(self) -> list[PairSummary]: ...


class MockWatchlistClient:
    def get_preview(self) -> list[PairSummary]:
        return [
            PairSummary(
                symbol="XAUUSD",
                status="BUY",
                confidence=78,
                subtext="4H demand reclaimed · 1H confirming",
            ),
            PairSummary(
                symbol="EURUSD",
                status="WAIT",
                confidence=41,
                subtext="Daily bias up, 4H mid-range — no entry",
            ),
            PairSummary(
                symbol="USDJPY",
                status="NEWS_RISK",
                subtext="CPI 14:30 invalidates the 4H setup",
                nextEvent="US CPI · 14:30",
            ),
            PairSummary(
                symbol="GBPUSD",
                status="NO_TRADE",
                subtext="Timeframes in conflict — strategy not met",
            ),
        ]
