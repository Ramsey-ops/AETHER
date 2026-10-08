"""Screen 7 — AI Assistant / Chart Analysis (Part 3B/3C).

There is no vision model yet — reading a pair/timeframe out of a chart
screenshot is Phase 3D+ work, gated on the trading strategy the user
hasn't provided. What's real today: the screenshot itself is genuinely
stored (same pattern as journal.py), and once the user manually confirms
which pair it's showing, a real live-data cross-check runs for that pair —
current price (Twelve Data), the next relevant calendar event (the same
FairEconomy feed News uses), and sentiment (the same aggregator News uses).
`ChartAiOutput` stays all-None until the Phase 3 model is connected; this
router never invents a decision, confidence, or reasoning.
"""

import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.db import CHART_SCREENSHOTS_DIR, get_connection
from app.models import (
    ChartAiOutput,
    ChartAnalysis,
    ChartAnalysisListResponse,
    ChartDetection,
    ChartLiveContext,
    ConfirmChartDetectionRequest,
)
from app.services.economic_calendar import create_economic_calendar_client
from app.services.market_data import create_market_data_client
from app.services.news_aggregator import create_news_aggregator

router = APIRouter(prefix="/api/chart-analysis", tags=["chart-analysis"])

market_data_client = create_market_data_client()
calendar_client = create_economic_calendar_client()
news_aggregator = create_news_aggregator()

_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}
_EXTENSION_FOR_CONTENT_TYPE = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
}
_GENERIC_CONTENT_TYPES = {"application/octet-stream", "binary/octet-stream"}

# The pair's two currencies, and which of the two isn't USD — used to scope
# the calendar/sentiment lookup to what's actually relevant to that pair.
_PAIR_CURRENCIES: dict[str, tuple[str, str]] = {
    "XAUUSD": ("XAU", "USD"),
    "EURUSD": ("EUR", "USD"),
    "GBPUSD": ("GBP", "USD"),
    "USDJPY": ("USD", "JPY"),
}
_NON_USD_LEG: dict[str, str] = {"XAUUSD": "XAU", "EURUSD": "EUR", "GBPUSD": "GBP", "USDJPY": "JPY"}


def _minutes(hhmm: str) -> int:
    h, m = (int(p) for p in hhmm.split(":"))
    return h * 60 + m


def _format_countdown(total_minutes: int) -> str:
    hours, minutes = divmod(max(0, total_minutes), 60)
    return f"{hours}h {minutes}m" if hours else f"{minutes}m"


def _next_event_for_pair(events, currencies: set):
    matching = [e for e in events if e.currency in currencies]
    if not matching:
        return None
    now_minutes = _minutes(datetime.now(timezone.utc).strftime("%H:%M"))
    upcoming = sorted((e for e in matching if _minutes(e.timeUTC) >= now_minutes), key=lambda e: _minutes(e.timeUTC))
    if upcoming:
        return upcoming[0]
    return sorted(matching, key=lambda e: _minutes(e.timeUTC))[-1]


def _build_live_context(pair: str) -> Optional[ChartLiveContext]:
    currencies = _PAIR_CURRENCIES.get(pair)
    if not currencies:
        return None

    quote = market_data_client.get_quote(pair)

    events = calendar_client.get_today()
    next_event = _next_event_for_pair(events, set(currencies))
    in_label = None
    if next_event is not None:
        now_minutes = _minutes(datetime.now(timezone.utc).strftime("%H:%M"))
        event_minutes = _minutes(next_event.timeUTC)
        if event_minutes >= now_minutes:
            in_label = _format_countdown(event_minutes - now_minutes)

    news = news_aggregator.get_news()
    non_usd_leg = _NON_USD_LEG[pair]
    sentiment_entry = next((s for s in news.sentiment if s.currency == non_usd_leg), None)

    return ChartLiveContext(
        livePrice=quote.price if quote else None,
        changePercent=quote.changePercent if quote else None,
        nextEventTitle=next_event.title if next_event else None,
        nextEventInLabel=in_label,
        nextEventImpact=next_event.impact if next_event else None,
        sentimentCurrency=non_usd_leg,
        sentimentScore=sentiment_entry.score if sentiment_entry else None,
    )


def _row_to_analysis(row: sqlite3.Row) -> ChartAnalysis:
    pair = row["pair"]
    return ChartAnalysis(
        id=row["id"],
        screenshotUrl=f"/media/charts/{row['screenshotFilename']}",
        uploadedAtUTC=row["createdAtUTC"],
        detection=ChartDetection(
            pair=pair,
            timeframe=row["timeframe"],
            source="User confirmed" if pair else None,
        ),
        liveContext=_build_live_context(pair) if pair else None,
        aiOutput=ChartAiOutput(),
        strategyConnected=False,
    )


def _get_or_404(conn: sqlite3.Connection, analysis_id: int) -> sqlite3.Row:
    row = conn.execute("SELECT * FROM chart_analyses WHERE id = ?", (analysis_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail=f"Chart analysis {analysis_id} not found")
    return row


@router.post("", response_model=ChartAnalysis)
async def upload_chart(
    file: UploadFile = File(...),
    pair: Optional[str] = Form(None),
    timeframe: Optional[str] = Form(None),
) -> ChartAnalysis:
    content_type = file.content_type or ""
    is_known_image_type = content_type in _ALLOWED_IMAGE_TYPES or content_type.startswith("image/")
    is_ambiguous_type = not content_type or content_type in _GENERIC_CONTENT_TYPES
    if not is_known_image_type and not is_ambiguous_type:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {content_type}")

    now = datetime.now(timezone.utc).isoformat()
    pair_norm = pair.upper().strip() if pair else None
    timeframe_norm = timeframe.strip() if timeframe else None

    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO chart_analyses (screenshotFilename, pair, timeframe, createdAtUTC) VALUES (?, ?, ?, ?)",
            ("", pair_norm, timeframe_norm, now),
        )
        analysis_id = cursor.lastrowid

        ext = Path(file.filename or "").suffix or _EXTENSION_FOR_CONTENT_TYPE.get(content_type, ".jpg")
        filename = f"{analysis_id}_{uuid.uuid4().hex}{ext}"
        contents = await file.read()
        (CHART_SCREENSHOTS_DIR / filename).write_bytes(contents)

        conn.execute("UPDATE chart_analyses SET screenshotFilename = ? WHERE id = ?", (filename, analysis_id))
        conn.commit()
        row = _get_or_404(conn, analysis_id)

    return _row_to_analysis(row)


@router.patch("/{analysis_id}/detection", response_model=ChartAnalysis)
def confirm_detection(analysis_id: int, body: ConfirmChartDetectionRequest) -> ChartAnalysis:
    with get_connection() as conn:
        _get_or_404(conn, analysis_id)
        conn.execute(
            "UPDATE chart_analyses SET pair = ?, timeframe = ? WHERE id = ?",
            (body.pair.upper().strip(), body.timeframe.strip(), analysis_id),
        )
        conn.commit()
        row = _get_or_404(conn, analysis_id)
    return _row_to_analysis(row)


@router.get("/{analysis_id}", response_model=ChartAnalysis)
def get_chart_analysis(analysis_id: int) -> ChartAnalysis:
    with get_connection() as conn:
        row = _get_or_404(conn, analysis_id)
    return _row_to_analysis(row)


@router.get("", response_model=ChartAnalysisListResponse)
def list_chart_analyses() -> ChartAnalysisListResponse:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM chart_analyses ORDER BY createdAtUTC DESC").fetchall()
    return ChartAnalysisListResponse(analyses=[_row_to_analysis(r) for r in rows])
