from datetime import datetime, timezone

from fastapi import APIRouter

from app.models import BriefingResponse
from app.services.decision_fusion import MockDecisionFusionClient
from app.services.goals import RealGoalService
from app.services.market_data import LiveTwelveDataClient, create_market_data_client
from app.services.market_timing import RealMarketTimingClient
from app.services.watchlist import MockWatchlistClient

router = APIRouter(prefix="/api/briefing", tags=["briefing"])

# Swap any of these for a Live* implementation of the same Protocol
# (see app/services/*.py) once that engine exists — the route below
# doesn't change.
decision_fusion = MockDecisionFusionClient()
market_timing = RealMarketTimingClient()  # genuinely real — see module docstring
watchlist = MockWatchlistClient()
goal_service = RealGoalService()  # genuinely real — backed by goal_settings + Journal
# The symbol list itself is still a placeholder (real per-user watchlists
# arrive with the TradingView sync, Part 2.4) — but each symbol's price is
# real once TWELVE_DATA_API_KEY is set, and DATA_UNAVAILABLE until then.
market_data = create_market_data_client()
market_data_connected = isinstance(market_data, LiveTwelveDataClient)


@router.get("/today", response_model=BriefingResponse)
def get_today_briefing() -> BriefingResponse:
    pairs = watchlist.get_preview()
    for pair in pairs:
        quote = market_data.get_quote(pair.symbol)
        if quote:
            pair.price = quote.price
            pair.changePercent = quote.changePercent

    verdict = decision_fusion.get_today_verdict()
    if verdict.dayStatus in ("WAITING_DAY", "NO_TRADE_DAY"):
        verdict.returnRecommendation = market_timing.get_return_recommendation()

    return BriefingResponse(
        date=datetime.now(timezone.utc).date().isoformat(),
        greetingName="Ramsey",
        currentSessionLabel=market_timing.get_current_session_label(),
        verdict=verdict,
        sessions=market_timing.get_sessions(),
        watchlistPreview=pairs,
        goalProgress=goal_service.get_current_progress(),
        isMockData=True,
        marketDataConnected=market_data_connected,
    )
