from fastapi import APIRouter

from app.models import Candle, MarketPair, MarketsResponse
from app.services.market_data import LiveTwelveDataClient, create_market_data_client
from app.services.pair_analysis import DISPLAY_NAMES
from app.services.watchlist import MockWatchlistClient

router = APIRouter(prefix="/api/markets", tags=["markets"])

watchlist = MockWatchlistClient()
market_data = create_market_data_client()
market_data_connected = isinstance(market_data, LiveTwelveDataClient)

DEFAULT_TIMEFRAME = "4H"


@router.get("", response_model=MarketsResponse)
def get_markets() -> MarketsResponse:
    pairs: list[MarketPair] = []
    for summary in watchlist.get_preview():
        quote = market_data.get_quote(summary.symbol)
        raw_candles = market_data.get_candles(summary.symbol, DEFAULT_TIMEFRAME) or []
        pairs.append(
            MarketPair(
                symbol=summary.symbol,
                displayName=DISPLAY_NAMES.get(summary.symbol, summary.symbol),
                status=summary.status,
                confidence=summary.confidence,
                subtext=summary.subtext,
                nextEvent=summary.nextEvent,
                price=quote.price if quote else None,
                changePercent=quote.changePercent if quote else None,
                candles=[Candle(timeUTC=c.timeUTC, close=c.close) for c in raw_candles],
            )
        )

    return MarketsResponse(
        pairs=pairs,
        marketDataConnected=market_data_connected,
        tradingViewConnected=False,
        syncNote=(
            "Preview watchlist — TradingView sync isn't connected yet. "
            "Prices below are live once a market data provider is configured."
        ),
    )
