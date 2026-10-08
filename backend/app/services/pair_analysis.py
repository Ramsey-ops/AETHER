"""Socket for the AI Decision Fusion Engine's per-pair output (Part 2.18,
Screen 2 — Pair Analysis). This is the SMC-ITC reasoning, recommendation,
confidence, and trade levels the trained Trading Strategy AI model (Phase 3)
will eventually produce.

`MockPairAnalysisClient` returns fixture content shaped like that eventual
output, keyed by symbol. It is illustrative copy, not a real read of real
structure — `aiModelConnected=False` is what tells the UI to say so. Swap in
a `LivePairAnalysisClient` implementing the same protocol once Phase 3
exists; callers don't change.
"""

from typing import Protocol

from app.models import AnalysisLevels, ReasoningPoint, TimeframeAlignmentRow, TradeStatus

DISPLAY_NAMES = {
    "XAUUSD": "Gold / US Dollar",
    "EURUSD": "Euro / US Dollar",
    "GBPUSD": "British Pound / US Dollar",
    "USDJPY": "US Dollar / Japanese Yen",
}


class PairAnalysisContent:
    def __init__(
        self,
        recommendation: TradeStatus,
        confidence: int | None,
        recommendationNote: str,
        timeframeAlignment: list[TimeframeAlignmentRow],
        levels: AnalysisLevels | None,
        reasoning: list[ReasoningPoint],
        riskWarning: str | None,
    ):
        self.recommendation = recommendation
        self.confidence = confidence
        self.recommendationNote = recommendationNote
        self.timeframeAlignment = timeframeAlignment
        self.levels = levels
        self.reasoning = reasoning
        self.riskWarning = riskWarning


class PairAnalysisClient(Protocol):
    def get_analysis(self, symbol: str) -> PairAnalysisContent: ...


class MockPairAnalysisClient:
    """Phase 2 stand-in, one fixture per watchlist symbol plus a generic
    fallback for anything else. Every field here is preview copy — the
    router sets aiModelConnected=False regardless of which fixture is
    returned."""

    def get_analysis(self, symbol: str) -> PairAnalysisContent:
        return _FIXTURES.get(symbol, _generic_fixture(symbol))


_FIXTURES: dict[str, PairAnalysisContent] = {
    "XAUUSD": PairAnalysisContent(
        recommendation="BUY",
        confidence=78,
        recommendationNote="Setup valid on 4H, confirmed on 1H. Await 15M entry refinement.",
        timeframeAlignment=[
            TimeframeAlignmentRow(timeframe="1M", note="Bullish continuation intact", bias="Bullish"),
            TimeframeAlignmentRow(timeframe="1W", note="Weekly demand held", bias="Bullish"),
            TimeframeAlignmentRow(timeframe="1D", note="Bias: up — structure unbroken", bias="Bullish"),
            TimeframeAlignmentRow(timeframe="4H", note="Primary setup — POI reclaimed", bias="Setup"),
            TimeframeAlignmentRow(timeframe="1H", note="CHoCH printed 06:00", bias="Confirmed"),
            TimeframeAlignmentRow(timeframe="15M", note="Waiting for entry refinement", bias="Pending"),
        ],
        levels=AnalysisLevels(
            entryZoneLow=3402,
            entryZoneHigh=3408,
            stopLoss=3388.40,
            takeProfit1=3441.00,
            takeProfit2=3468.50,
            riskRewardRatio="1 : 3.4",
            note="Extended from the 1D liquidity pool at 3,470 — trend strength and ATR support the wider target.",
        ),
        reasoning=[
            ReasoningPoint(text="4H swept Friday's low, then reclaimed the discount POI — liquidity taken before the move.", kind="confirm"),
            ReasoningPoint(text="1H change of character with displacement; imbalance left at 3,404 for the retrace.", kind="confirm"),
            ReasoningPoint(text="Fundamentals soft-supportive: real yields easing, DXY rejected weekly supply.", kind="caution"),
            ReasoningPoint(text="News: no high-impact gold event before 14:30. Sentiment on USD reads mildly negative (-0.3).", kind="news"),
        ],
        riskWarning="A hot CPI print invalidates this setup. The engine will re-score at 14:35 and notify you. Position sizing stays yours.",
    ),
    "EURUSD": PairAnalysisContent(
        recommendation="WAIT",
        confidence=41,
        recommendationNote="Daily bias up, but 4H is mid-range — no defined entry yet.",
        timeframeAlignment=[
            TimeframeAlignmentRow(timeframe="1W", note="Range-bound since last month's high", bias="Neutral"),
            TimeframeAlignmentRow(timeframe="1D", note="Bias: up — but no fresh POI", bias="Bullish"),
            TimeframeAlignmentRow(timeframe="4H", note="Sitting mid-range — no reaction yet", bias="Neutral"),
            TimeframeAlignmentRow(timeframe="1H", note="No structure shift to react to", bias="Pending"),
        ],
        levels=None,
        reasoning=[
            ReasoningPoint(text="Daily structure still favors upside, but price hasn't reached a point of interest.", kind="confirm"),
            ReasoningPoint(text="USD CPI at 14:30 sits ahead of this pair — a fresh entry before the print would be premature.", kind="news"),
        ],
        riskWarning="US CPI at 14:30 can move this pair sharply either direction. The engine holds WAIT until after the print.",
    ),
    "USDJPY": PairAnalysisContent(
        recommendation="NEWS_RISK",
        confidence=None,
        recommendationNote="A valid 4H setup exists, but the upcoming CPI print invalidates it before entry.",
        timeframeAlignment=[
            TimeframeAlignmentRow(timeframe="1D", note="Bias: up — structure intact", bias="Bullish"),
            TimeframeAlignmentRow(timeframe="4H", note="Setup formed, but sits directly ahead of CPI", bias="Setup"),
            TimeframeAlignmentRow(timeframe="1H", note="Held pending news outcome", bias="Pending"),
        ],
        levels=None,
        reasoning=[
            ReasoningPoint(text="4H setup structurally valid, but too close to a high-impact release to trust the levels.", kind="caution"),
            ReasoningPoint(text="US CPI (14:30) is a direct driver for this pair — the engine withholds entries until after the print.", kind="news"),
        ],
        riskWarning="US CPI at 14:30 invalidates this setup on a hot or cold surprise. The engine re-scores immediately after the release.",
    ),
    "GBPUSD": PairAnalysisContent(
        recommendation="NO_TRADE",
        confidence=None,
        recommendationNote="Daily and 4H structure disagree — the strategy's alignment rule isn't met.",
        timeframeAlignment=[
            TimeframeAlignmentRow(timeframe="1D", note="Bias: down — lower high printed", bias="Bearish"),
            TimeframeAlignmentRow(timeframe="4H", note="Bias: up — conflicts with daily", bias="Bullish"),
            TimeframeAlignmentRow(timeframe="1H", note="No entry considered while timeframes conflict", bias="Pending"),
        ],
        levels=None,
        reasoning=[
            ReasoningPoint(text="Daily and 4H bias disagree — the strategy requires alignment before it will consider an entry.", kind="caution"),
        ],
        riskWarning=None,
    ),
}


def _generic_fixture(symbol: str) -> PairAnalysisContent:
    return PairAnalysisContent(
        recommendation="DATA_UNAVAILABLE",
        confidence=None,
        recommendationNote="No preview analysis is configured for this symbol yet.",
        timeframeAlignment=[],
        levels=None,
        reasoning=[],
        riskWarning=None,
    )
