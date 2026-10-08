import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.db import SCREENSHOTS_DIR, get_connection
from app.models import (
    AddLessonRequest,
    CreateTradeRequest,
    JournalResponse,
    JournalStats,
    TradeLogEntry,
)

router = APIRouter(prefix="/api/journal", tags=["journal"])

_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}
_EXTENSION_FOR_CONTENT_TYPE = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
}
# Multipart clients that can't determine a real type (some Android content://
# resolvers, generic upload libraries) fall back to one of these rather than
# omitting Content-Type — treat them the same as "unknown", not "rejected".
_GENERIC_CONTENT_TYPES = {"application/octet-stream", "binary/octet-stream"}


def _row_to_entry(row: sqlite3.Row) -> TradeLogEntry:
    return TradeLogEntry(
        id=row["id"],
        symbol=row["symbol"],
        direction=row["direction"],
        entryPrice=row["entryPrice"],
        exitPrice=row["exitPrice"],
        stopLoss=row["stopLoss"],
        resultR=row["resultR"],
        followedPlan=bool(row["followedPlan"]),
        strategyTag=row["strategyTag"],
        notes=row["notes"],
        screenshotUrl=f"/media/journal/{row['screenshotPath']}" if row["screenshotPath"] else None,
        lesson=row["lesson"],
        aiComment=None,  # Phase 3 socket — never fabricated for real logged trades.
        sentForRetraining=bool(row["sentForRetraining"]),
        closedAtUTC=row["closedAtUTC"],
        createdAtUTC=row["createdAtUTC"],
    )


def _get_trade_or_404(conn: sqlite3.Connection, trade_id: int) -> sqlite3.Row:
    row = conn.execute("SELECT * FROM trades WHERE id = ?", (trade_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail=f"Trade {trade_id} not found")
    return row


@router.get("", response_model=JournalResponse)
def get_journal() -> JournalResponse:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM trades ORDER BY closedAtUTC DESC").fetchall()

    trades = [_row_to_entry(r) for r in rows]
    total = len(trades)
    stats = JournalStats(
        totalTrades=total,
        winRatePercent=round(sum(1 for t in trades if t.resultR > 0) / total * 100, 1) if total else None,
        avgR=round(sum(t.resultR for t in trades) / total, 2) if total else None,
        disciplinePercent=round(sum(1 for t in trades if t.followedPlan) / total * 100, 1) if total else None,
    )
    return JournalResponse(stats=stats, trades=trades)


@router.post("/trades", response_model=TradeLogEntry)
def create_trade(body: CreateTradeRequest) -> TradeLogEntry:
    now = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO trades (
                symbol, direction, entryPrice, exitPrice, stopLoss, resultR,
                followedPlan, strategyTag, notes, closedAtUTC, createdAtUTC
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                body.symbol.upper(),
                body.direction,
                body.entryPrice,
                body.exitPrice,
                body.stopLoss,
                body.resultR,
                int(body.followedPlan),
                body.strategyTag,
                body.notes,
                now,
                now,
            ),
        )
        conn.commit()
        row = _get_trade_or_404(conn, cursor.lastrowid)
    return _row_to_entry(row)


@router.post("/trades/{trade_id}/screenshot", response_model=TradeLogEntry)
async def upload_screenshot(trade_id: int, file: UploadFile = File(...)) -> TradeLogEntry:
    # Mobile clients (Android's content:// picker results especially) don't
    # always report a precise Content-Type — some omit it, some fall back to
    # a generic binary type. Only reject when the type is both present AND
    # specifically non-image; an ambiguous type is treated as "unknown, but
    # not disallowed" rather than refused outright.
    content_type = file.content_type or ""
    is_known_image_type = content_type in _ALLOWED_IMAGE_TYPES or content_type.startswith("image/")
    is_ambiguous_type = not content_type or content_type in _GENERIC_CONTENT_TYPES

    if not is_known_image_type and not is_ambiguous_type:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {content_type}")

    with get_connection() as conn:
        _get_trade_or_404(conn, trade_id)

        ext = Path(file.filename or "").suffix or _EXTENSION_FOR_CONTENT_TYPE.get(content_type, ".jpg")
        filename = f"{trade_id}_{uuid.uuid4().hex}{ext}"
        contents = await file.read()
        (SCREENSHOTS_DIR / filename).write_bytes(contents)

        conn.execute("UPDATE trades SET screenshotPath = ? WHERE id = ?", (filename, trade_id))
        conn.commit()
        row = _get_trade_or_404(conn, trade_id)
    return _row_to_entry(row)


@router.post("/trades/{trade_id}/lesson", response_model=TradeLogEntry)
def add_lesson(trade_id: int, body: AddLessonRequest) -> TradeLogEntry:
    with get_connection() as conn:
        _get_trade_or_404(conn, trade_id)
        conn.execute("UPDATE trades SET lesson = ? WHERE id = ?", (body.lesson, trade_id))
        conn.commit()
        row = _get_trade_or_404(conn, trade_id)
    return _row_to_entry(row)


@router.post("/trades/{trade_id}/send-for-retraining", response_model=TradeLogEntry)
def send_for_retraining(trade_id: int) -> TradeLogEntry:
    """Marks the trade as flagged for the (not-yet-built) retraining
    pipeline. The flag itself is real, persisted state — honest bookkeeping
    of user intent — even though no retraining pipeline consumes it yet."""
    with get_connection() as conn:
        _get_trade_or_404(conn, trade_id)
        conn.execute("UPDATE trades SET sentForRetraining = 1 WHERE id = ?", (trade_id,))
        conn.commit()
        row = _get_trade_or_404(conn, trade_id)
    return _row_to_entry(row)


@router.delete("/trades/{trade_id}", status_code=204)
def delete_trade(trade_id: int) -> None:
    with get_connection() as conn:
        row = _get_trade_or_404(conn, trade_id)
        if row["screenshotPath"]:
            screenshot_file = SCREENSHOTS_DIR / row["screenshotPath"]
            if screenshot_file.exists():
                screenshot_file.unlink()
        conn.execute("DELETE FROM trades WHERE id = ?", (trade_id,))
        conn.commit()
