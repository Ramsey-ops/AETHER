"""Real Goal Management Service (Backend SRS Part 2.13, Service 7;
requirements in Part 2.10, FR-GOAL-001/002).

Currency-only by design — the app never computes position sizing or R, so it
has no reliable way to turn "R" into a dollar figure on its own. The account
balance target is the one number the trader tells it directly (via Screen
6's Edit), and everything else (remaining, %, days left, which days this
week had a trade) is real arithmetic over that plus the Journal's own data.
"""

import calendar
from datetime import date, datetime, timedelta, timezone
from typing import Protocol

from app.db import get_connection
from app.models import (
    GoalProgress,
    GoalSettings,
    GoalsResponse,
    MonthlyGoalProgress,
    UpdateGoalSettingsRequest,
    WeeklyDayActivity,
    WeeklyGoalProgress,
)

_WEEKDAY_LABELS = ["M", "T", "W", "T", "F"]


def _percent(achieved: float, target: float) -> float:
    if target == 0:
        return 0.0
    return round(max(0.0, achieved / target) * 100, 1)


def _days_left_in_month(today: date) -> int:
    last_day = calendar.monthrange(today.year, today.month)[1]
    return last_day - today.day


def _current_week_weekdays(today: date) -> list[date]:
    monday = today - timedelta(days=today.weekday())
    return [monday + timedelta(days=i) for i in range(5)]


def _traded_dates_in_range(conn, start: date, end: date) -> set[str]:
    rows = conn.execute(
        "SELECT DISTINCT date(closedAtUTC) as d FROM trades WHERE date(closedAtUTC) BETWEEN ? AND ?",
        (start.isoformat(), end.isoformat()),
    ).fetchall()
    return {row["d"] for row in rows}


def _discipline_note(remaining: float) -> str:
    if remaining <= 0:
        return (
            "Target met. That's not a reason to force more trades either — "
            "the strategy still decides, not the number."
        )
    return (
        f"Being ${remaining:,.0f} behind is not a reason to trade. If no setup "
        "qualifies, the answer stays NO TRADE — the target moves to next "
        "period, the discipline does not."
    )


class GoalService(Protocol):
    def get_current_progress(self) -> GoalProgress: ...
    def get_goals(self) -> GoalsResponse: ...
    def get_settings(self) -> GoalSettings: ...
    def update_settings(self, req: UpdateGoalSettingsRequest) -> GoalSettings: ...


class RealGoalService:
    def get_settings(self) -> GoalSettings:
        with get_connection() as conn:
            row = conn.execute("SELECT * FROM goal_settings WHERE id = 1").fetchone()
        return GoalSettings(
            startingBalance=row["startingBalance"],
            currentBalance=row["currentBalance"],
            monthlyTargetCurrency=row["monthlyTargetCurrency"],
            weeklyTargetCurrency=row["weeklyTargetCurrency"],
            weeklyAchievedCurrency=row["weeklyAchievedCurrency"],
        )

    def update_settings(self, req: UpdateGoalSettingsRequest) -> GoalSettings:
        with get_connection() as conn:
            conn.execute(
                """
                UPDATE goal_settings SET
                    startingBalance = ?, currentBalance = ?, monthlyTargetCurrency = ?,
                    weeklyTargetCurrency = ?, weeklyAchievedCurrency = ?, updatedAtUTC = ?
                WHERE id = 1
                """,
                (
                    req.startingBalance,
                    req.currentBalance,
                    req.monthlyTargetCurrency,
                    req.weeklyTargetCurrency,
                    req.weeklyAchievedCurrency,
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
            conn.commit()
        return self.get_settings()

    def get_current_progress(self) -> GoalProgress:
        settings = self.get_settings()
        today = datetime.now(timezone.utc).date()
        achieved = settings.currentBalance - settings.startingBalance
        remaining = settings.monthlyTargetCurrency - achieved
        note = _discipline_note(remaining) if settings.monthlyTargetCurrency else None
        return GoalProgress(
            periodLabel=f"{today.strftime('%B')} goal",
            targetCurrency=settings.monthlyTargetCurrency,
            currentCurrency=achieved,
            note=note,
        )

    def get_goals(self) -> GoalsResponse:
        settings = self.get_settings()
        today = datetime.now(timezone.utc).date()

        monthly_achieved = settings.currentBalance - settings.startingBalance
        monthly_remaining = settings.monthlyTargetCurrency - monthly_achieved
        monthly = MonthlyGoalProgress(
            periodLabel=today.strftime("%B"),
            targetCurrency=settings.monthlyTargetCurrency,
            achievedCurrency=monthly_achieved,
            remainingCurrency=monthly_remaining,
            percent=_percent(monthly_achieved, settings.monthlyTargetCurrency),
            daysLeftInMonth=_days_left_in_month(today),
            startingBalance=settings.startingBalance,
            currentBalance=settings.currentBalance,
        )

        weekdays = _current_week_weekdays(today)
        with get_connection() as conn:
            traded_dates = _traded_dates_in_range(conn, weekdays[0], weekdays[-1])
        days_used = sum(1 for d in weekdays if d.isoformat() in traded_dates and d <= today)
        rest_days = sum(1 for d in weekdays if d <= today and d.isoformat() not in traded_dates)
        weekly_note = (
            f"{days_used} trading day{'s' if days_used != 1 else ''} used. "
            f"Nothing owed on the {rest_days} day{'s' if rest_days != 1 else ''} you sat out."
            if days_used or rest_days
            else "No days have passed this week yet."
        )
        weekly = WeeklyGoalProgress(
            targetCurrency=settings.weeklyTargetCurrency,
            achievedCurrency=settings.weeklyAchievedCurrency,
            percent=_percent(settings.weeklyAchievedCurrency, settings.weeklyTargetCurrency),
            days=[
                WeeklyDayActivity(label=label, date=d.isoformat(), traded=d.isoformat() in traded_dates)
                for label, d in zip(_WEEKDAY_LABELS, weekdays)
            ],
            note=weekly_note,
        )

        return GoalsResponse(
            monthly=monthly,
            weekly=weekly,
            disciplineNote=_discipline_note(monthly_remaining),
        )
