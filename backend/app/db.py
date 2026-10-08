"""SQLite persistence for the trader's own journal data (Part 2.14, FR-JRNL
series). Unlike every other Phase 2 module, there's no external API to
substitute here — a trade log is the trader's own history, not market or AI
data — so "real" means a real database instead of an in-memory fixture.

Plain `sqlite3` (no ORM) to match the project's lean-dependency style; the
schema is small enough that hand-written SQL stays readable.
"""

import sqlite3
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DATA_DIR / "aether.db"
SCREENSHOTS_DIR = DATA_DIR / "screenshots"
CHART_SCREENSHOTS_DIR = DATA_DIR / "chart_screenshots"

_SCHEMA = """
CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
    entryPrice REAL NOT NULL,
    exitPrice REAL NOT NULL,
    stopLoss REAL,
    resultR REAL NOT NULL,
    followedPlan INTEGER NOT NULL DEFAULT 0,
    strategyTag TEXT,
    notes TEXT,
    screenshotPath TEXT,
    lesson TEXT,
    sentForRetraining INTEGER NOT NULL DEFAULT 0,
    closedAtUTC TEXT NOT NULL,
    createdAtUTC TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goal_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    startingBalance REAL NOT NULL DEFAULT 0,
    currentBalance REAL NOT NULL DEFAULT 0,
    monthlyTargetCurrency REAL NOT NULL DEFAULT 0,
    weeklyTargetCurrency REAL NOT NULL DEFAULT 0,
    weeklyAchievedCurrency REAL NOT NULL DEFAULT 0,
    updatedAtUTC TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chart_analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    screenshotFilename TEXT NOT NULL,
    pair TEXT,
    timeframe TEXT,
    createdAtUTC TEXT NOT NULL
);
"""


def get_connection() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    from datetime import datetime, timezone

    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    CHART_SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    with get_connection() as conn:
        conn.executescript(_SCHEMA)
        # Seed a single settings row with an honest all-zero state — no
        # fabricated targets or progress, same convention as Journal
        # starting empty. The user sets real numbers via Screen 6's Edit.
        conn.execute(
            """
            INSERT OR IGNORE INTO goal_settings
                (id, startingBalance, currentBalance, monthlyTargetCurrency,
                 weeklyTargetCurrency, weeklyAchievedCurrency, updatedAtUTC)
            VALUES (1, 0, 0, 0, 0, 0, ?)
            """,
            (datetime.now(timezone.utc).isoformat(),),
        )
        conn.commit()

