from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query

from app.models import Candle, PairAnalysisResponse
from app.services.market_data import LiveTwelveDataClient, create_market_data_client
from app.services.pair_analysis import DISPLAY_NAMES, MockPairAnalysisClient

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

pair_analysis = MockPairAnalysisClient()
market_data = create_market_data_client()
market_data_connected = isinstance(market_data, LiveTwelveDataClient)

AVAILABLE_TIMEFRAMES = ["1H", "4H", "1D", "1W"]
KNOWN_SYMBOLS = {"XAUUSD", "EURUSD", "GBPUSD", "USDJPY"}


@router.get("/{symbol}", response_model=PairAnalysisResponse)
def get_pair_analysis(
    symbol: str,
    timeframe: str = Query(default="4H"),
) -> PairAnalysisResponse:
    symbol = symbol.upper()
    if symbol not in KNOWN_SYMBOLS:
        raise HTTPException(status_code=404, detail=f"Unknown symbol: {symbol}")
    if timeframe not in AVAILABLE_TIMEFRAMES:
        raise HTTPException(status_code=400, detail=f"Unknown timeframe: {timeframe}")

    quote = market_data.get_quote(symbol)
    raw_candles = market_data.get_candles(symbol, timeframe) or []
    candles = [Candle(timeUTC=c.timeUTC, close=c.close) for c in raw_candles]
    content = pair_analysis.get_analysis(symbol)

    return PairAnalysisResponse(
        symbol=symbol,
        displayName=DISPLAY_NAMES.get(symbol, symbol),
        updatedAtUTC=datetime.now(timezone.utc).isoformat(),
        availableTimeframes=AVAILABLE_TIMEFRAMES,
        selectedTimeframe=timeframe,
        price=quote.price if quote else None,
        changePercent=quote.changePercent if quote else None,
        candles=candles,
        marketDataConnected=market_data_connected,
        recommendation=content.recommendation,
        confidence=content.confidence,
        recommendationNote=content.recommendationNote,
        timeframeAlignment=content.timeframeAlignment,
        levels=content.levels,
        reasoning=content.reasoning,
        riskWarning=content.riskWarning,
        aiModelConnected=False,
    )
