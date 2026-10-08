"""Socket for the AI Decision Fusion Engine (Part 2.18).

`MockDecisionFusionClient` returns fixture data shaped like the real engine's
eventual output (FR-DEC-007 confidence, FR-DEC-008 explanation). Swap in a
`LiveDecisionFusionClient` implementing the same `DecisionFusionClient`
protocol once that engine exists — callers don't change.
"""

from typing import Protocol

from app.models import DecisionSummary, Tally


class DecisionFusionClient(Protocol):
    def get_today_verdict(self) -> DecisionSummary: ...


class MockDecisionFusionClient:
    """Phase 2 stand-in. The headline/reasoning below is illustrative copy —
    a preview of the shape a verdict will take — not a real analysis of
    real conditions. `aiModelConnected=False` is what tells the UI to say
    so, instead of presenting it as a genuine decision."""

    def get_today_verdict(self) -> DecisionSummary:
        return DecisionSummary(
            dayStatus="WAITING_DAY",
            headline="Patience day",
            reasoning=(
                "Preview only — the trained Trading Strategy AI model "
                "(Phase 3) isn't connected yet. Once it is, this verdict "
                "will reflect the real SMC-ITC analysis of live conditions."
            ),
            confidence=None,
            tally=Tally(live=1, waiting=2, noTrade=1),
            aiModelConnected=False,
        )
