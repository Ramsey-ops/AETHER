"""Pydantic response schemas for the Aether mock backend.

Field shapes mirror the tables in `Backend Architecture & Database Design.md`
(Part 2.13) so that swapping a mock module for a real service later changes
only the data source, not these contracts or the frontend that consumes them.
"""

from typing import Literal, Optional

from pydantic import BaseModel

# Shared across every screen — see "APPLICATION STATES" in the project brief.
# WAIT and NO_TRADE are legitimate outcomes, not errors.
TradeStatus = Literal[
    "BUY",
    "SELL",
    "WAIT",
    "NO_TRADE",
    "NEWS_RISK",
    "MONITOR",
    "ANALYZING",
    "DATA_UNAVAILABLE",
]

# FR-DASH-001: Trading Day Evaluation
DayStatus = Literal["TRADING_DAY", "WAITING_DAY", "NO_TRADE_DAY"]


class Tally(BaseModel):
    live: int
    waiting: int
    noTrade: int


class ReturnRecommendation(BaseModel):
    """FR-TIME-006 (Part 2.10): when to come back. Computed from real,
    fixed session-clock facts (RealMarketTimingClient) — not an AI
    prediction, so this is populated even while aiModelConnected is False.
    """

    returnAtUTC: str
    reason: str


class DecisionSummary(BaseModel):
    """AI Decision Fusion Engine output shape (Part 2.18, FR-DEC-007/008).

    Phase 3 (the trained Trading Strategy AI model) doesn't exist yet.
    `aiModelConnected` must stay False — and the UI must render this
    distinctly from "this is a decision" — until a real
    `LiveDecisionFusionClient` is swapped in. Never flip this to True as a
    way of making mock data look finished.
    """

    dayStatus: DayStatus
    headline: str
    reasoning: str
    confidence: Optional[int] = None
    tally: Tally
    aiModelConnected: bool = False
    returnRecommendation: Optional[ReturnRecommendation] = None


class SessionInfo(BaseModel):
    name: str
    opensAtUTC: str
    isOpen: bool
    opensInLabel: Optional[str] = None


class PairSummary(BaseModel):
    symbol: str
    status: TradeStatus
    confidence: Optional[int] = None
    subtext: str
    nextEvent: Optional[str] = None
    # Real quote data from MarketDataClient (Twelve Data). None means
    # "provider not configured or the call failed" — render as unavailable,
    # never substitute a fabricated number.
    price: Optional[float] = None
    changePercent: Optional[float] = None


class GoalProgress(BaseModel):
    """Condensed goal card on Screen 1. Currency-only — position sizing and
    the actual R math live in the trader's head and the Journal; the goal
    system only ever tracks the account balance target they set themselves
    (Part 2.10, FR-GOAL-002)."""

    periodLabel: str
    targetCurrency: float
    currentCurrency: float
    note: Optional[str] = None


class Candle(BaseModel):
    """One close price at a point in time — real OHLC data from the market
    data provider, used to draw Screen 2's sparkline. Never fabricated;
    the candles list is empty when the provider isn't configured."""

    timeUTC: str
    close: float


TimeframeBias = Literal["Bullish", "Bearish", "Neutral", "Setup", "Confirmed", "Pending"]


class TimeframeAlignmentRow(BaseModel):
    """One row of the "timeframe alignment" table (Part 2.18 SMC-ITC
    output). This is the trained Trading Strategy AI's read of that
    timeframe — Phase 3 socket content, not derived from real candles."""

    timeframe: str
    note: str
    bias: TimeframeBias


class AnalysisLevels(BaseModel):
    """Entry/SL/TP levels and dynamic R:R — the AI model's proposed trade
    plan for this setup (Part 2.18). Phase 3 socket content."""

    entryZoneLow: float
    entryZoneHigh: float
    stopLoss: float
    takeProfit1: float
    takeProfit2: float
    riskRewardRatio: str
    note: str


ReasoningKind = Literal["confirm", "caution", "news"]


class ReasoningPoint(BaseModel):
    text: str
    kind: ReasoningKind


class PairAnalysisResponse(BaseModel):
    """Screen 2 — Pair Analysis. `price`/`changePercent`/`candles` are real
    market data when a provider is configured. Everything describing the
    AI's judgment (`recommendation`, `confidence`, `timeframeAlignment`,
    `levels`, `reasoning`) is Phase 3 socket content and stays behind
    `aiModelConnected=False` until the trained model is wired in."""

    symbol: str
    displayName: str
    updatedAtUTC: str
    availableTimeframes: list[str]
    selectedTimeframe: str

    price: Optional[float] = None
    changePercent: Optional[float] = None
    candles: list[Candle] = []
    marketDataConnected: bool = False

    recommendation: TradeStatus
    confidence: Optional[int] = None
    recommendationNote: str
    timeframeAlignment: list[TimeframeAlignmentRow]
    levels: Optional[AnalysisLevels] = None
    reasoning: list[ReasoningPoint]
    riskWarning: Optional[str] = None
    aiModelConnected: bool = False


class MarketPair(BaseModel):
    """One row of Screen 3 — the full TradingView-synced watchlist. Same
    preview/real split as the Screen 1 condensed version: `status`/
    `confidence`/`subtext` are Phase 2 preview content (and the symbol list
    itself is a placeholder until TradingView sync exists — Part 2.4,
    FR-TV-003); `price`/`changePercent`/`candles` are real market data once
    a provider is configured."""

    symbol: str
    displayName: str
    status: TradeStatus
    confidence: Optional[int] = None
    subtext: str
    nextEvent: Optional[str] = None
    price: Optional[float] = None
    changePercent: Optional[float] = None
    candles: list[Candle] = []


class MarketsResponse(BaseModel):
    pairs: list[MarketPair]
    marketDataConnected: bool = False
    # TradingView sync (Part 2.4) doesn't exist yet — the pair list is a
    # fixed preview set, not synced from a real TradingView watchlist.
    tradingViewConnected: bool = False
    syncNote: str


EventImpact = Literal["low", "medium", "high"]


class CalendarEvent(BaseModel):
    """One economic calendar row. Phase 2 had no free provider wired up, so
    this was fixed preview content. Phase 3A added a real source (see
    economic_calendar.py's LiveFairEconomyCalendarClient) — this model shape
    is unchanged, but instances now come from real events when
    `NewsResponse.economicCalendarConnected` is true, and from the
    `MockEconomicCalendarClient` fixture only as a fallback."""

    timeUTC: str
    title: str
    currency: str
    impact: EventImpact
    forecast: Optional[str] = None
    previous: Optional[str] = None
    affectedPairs: list[str] = []
    note: Optional[str] = None


class NextHighImpact(BaseModel):
    event: CalendarEvent
    # Real countdown math to the event's fixed clock time — same technique
    # as ReturnRecommendation, genuine even though the event itself is
    # preview content.
    inLabel: str


SentimentLabel = Literal["Bullish", "Bearish", "Neutral"]

# The AI's own judgment of whether this headline helps or hurts the trader's
# live setups on the four watchlist pairs. Distinct from `impact` (a
# deterministic high/medium/low severity classification) — this is the
# interpretive field, only ever populated by NewsInterpreter, never fabricated
# as a placeholder. None means "no AI interpretation available yet."
TradeImpact = Literal["in_favor", "not_in_favor", "neutral", "news_risk"]


class CurrencySentiment(BaseModel):
    currency: str
    score: float


class Headline(BaseModel):
    text: str
    currencyTag: str
    sentimentLabel: SentimentLabel
    sentimentScore: float
    timeAgoLabel: str

    # --- FACT fields: sourced directly from the publisher, never invented ---
    source: str
    url: Optional[str] = None
    summary: Optional[str] = None
    affectedAssets: list[str] = []
    impact: EventImpact = "low"

    # --- AI INTERPRETATION fields: Claude's reasoning about the FACT fields
    # above, never treated as certain. All null until NewsInterpreter runs
    # (requires ANTHROPIC_API_KEY) — a null value here must render as "no AI
    # read on this yet," never silently default to a guess. ---
    aiInterpreted: bool = False
    rootCause: Optional[str] = None
    marketImplication: Optional[str] = None
    tradeImpact: Optional[TradeImpact] = None
    # One flowing sentence blending direction + reasoning for the "AETHER
    # INSTITUTIONAL TAKE" card (e.g. "Bullish for GBP against EUR due to
    # elevated Gilt yields and sticky inflation expectations.") — still an
    # AI INTERPRETATION field, just phrased for display rather than split
    # across rootCause/marketImplication.
    institutionalTake: Optional[str] = None


class NewsResponse(BaseModel):
    date: str
    nextHighImpact: Optional[NextHighImpact] = None
    calendar: list[CalendarEvent]
    sentiment: list[CurrencySentiment]
    headlines: list[Headline]
    economicCalendarConnected: bool = False
    # True once at least one live news source (Finnhub / Alpha Vantage /
    # Marketaux / RSS) contributed headlines.
    newsConnected: bool = False
    # Which live sources actually contributed this response — lets the UI
    # show exactly what's real rather than one blanket boolean.
    newsSourcesConnected: list[str] = []
    # True once ANTHROPIC_API_KEY is configured and the interpretation call
    # succeeded for this batch — independent of newsConnected.
    aiInterpretationConnected: bool = False


class BriefingResponse(BaseModel):
    date: str
    greetingName: str
    currentSessionLabel: str
    verdict: DecisionSummary
    sessions: list[SessionInfo]
    watchlistPreview: list[PairSummary]
    goalProgress: GoalProgress
    # True while ANY part of this response is still placeholder content:
    # goals, the watchlist symbol list, and the AI verdict itself. `date`,
    # `currentSessionLabel`, `sessions`, and `returnRecommendation` are
    # real (computed from actual UTC time) regardless of this flag.
    # Distinct from marketDataConnected below — the two now legitimately
    # disagree, so the UI must not collapse them into one banner.
    isMockData: bool = True
    # True once prices in watchlistPreview are real Twelve Data quotes
    # rather than all-null placeholders.
    marketDataConnected: bool = False


TradeDirection = Literal["BUY", "SELL"]


class TradeLogEntry(BaseModel):
    """A trader's own logged trade (Part 2.14). This is real, persisted
    user data from the moment it's created — there's no Phase 2/Phase 3
    split here the way there is for market or AI-judgment data. `aiComment`
    is the one exception: it's Phase 3 retrospective-critique content
    (Part 2.18) and stays null for every trade until that engine exists —
    never fabricated to make an empty journal look populated."""

    id: int
    symbol: str
    direction: TradeDirection
    entryPrice: float
    exitPrice: float
    stopLoss: Optional[float] = None
    resultR: float
    followedPlan: bool
    strategyTag: Optional[str] = None
    notes: Optional[str] = None
    screenshotUrl: Optional[str] = None
    lesson: Optional[str] = None
    aiComment: Optional[str] = None
    sentForRetraining: bool = False
    closedAtUTC: str
    createdAtUTC: str


class JournalStats(BaseModel):
    """Real aggregate arithmetic over the trader's own logged trades — no
    AI judgment involved, so these are populated even with aiModelConnected
    False. All zero/null when there are no trades yet."""

    totalTrades: int
    winRatePercent: Optional[float] = None
    avgR: Optional[float] = None
    disciplinePercent: Optional[float] = None


class JournalResponse(BaseModel):
    stats: JournalStats
    trades: list[TradeLogEntry]


class CreateTradeRequest(BaseModel):
    symbol: str
    direction: TradeDirection
    entryPrice: float
    exitPrice: float
    stopLoss: Optional[float] = None
    resultR: float
    followedPlan: bool = False
    strategyTag: Optional[str] = None
    notes: Optional[str] = None


class AddLessonRequest(BaseModel):
    lesson: str


class WeeklyDayActivity(BaseModel):
    """One weekday (Mon-Fri) of the trading week. `traded` is real — derived
    from whether a journal trade closed that day, not a placeholder."""

    label: str
    date: str
    traded: bool


class MonthlyGoalProgress(BaseModel):
    periodLabel: str
    targetCurrency: float
    achievedCurrency: float
    remainingCurrency: float
    percent: float
    daysLeftInMonth: int
    startingBalance: float
    currentBalance: float


class WeeklyGoalProgress(BaseModel):
    targetCurrency: float
    achievedCurrency: float
    percent: float
    days: list[WeeklyDayActivity]
    note: str


class GoalsResponse(BaseModel):
    monthly: MonthlyGoalProgress
    weekly: WeeklyGoalProgress
    disciplineNote: str


class GoalSettings(BaseModel):
    startingBalance: float
    currentBalance: float
    monthlyTargetCurrency: float
    weeklyTargetCurrency: float
    weeklyAchievedCurrency: float


class UpdateGoalSettingsRequest(BaseModel):
    startingBalance: float
    currentBalance: float
    monthlyTargetCurrency: float
    weeklyTargetCurrency: float
    weeklyAchievedCurrency: float


# ── Screen 7 — AI Assistant / Chart Analysis (Part 3B/3C) ──────────────────
# No vision model exists yet (that's Phase 3D+, gated on the trading
# strategy the user hasn't provided). What's genuinely real today: storing
# the uploaded screenshot, and — once the user manually confirms which pair
# it's showing (since Aether can't read that from the image yet) — a real
# live-data cross-check (price, next calendar event, sentiment) for that
# pair. `ChartAiOutput` fields stay None until the model is connected;
# never populate them with placeholder/simulated values.

ChartAnalysisDecision = Literal["BUY", "SELL", "WAIT", "NO_TRADE", "MONITOR", "NEWS_RISK"]


class ChartDetection(BaseModel):
    pair: Optional[str] = None
    timeframe: Optional[str] = None
    # "User confirmed" today; would become "Vision AI" once that exists.
    # Never a fabricated confidence number — there is no detector yet.
    source: Optional[str] = None


class ChartLiveContext(BaseModel):
    """All real, all sourced the same way Screens 2/4 already do —
    Twelve Data for price, the FairEconomy calendar feed for the next
    event, and the news aggregator's sentiment for this pair's non-USD
    leg. None of these fields is an AI interpretation."""

    livePrice: Optional[float] = None
    changePercent: Optional[float] = None
    nextEventTitle: Optional[str] = None
    nextEventInLabel: Optional[str] = None
    nextEventImpact: Optional[EventImpact] = None
    sentimentCurrency: Optional[str] = None
    sentimentScore: Optional[float] = None


class ChartAiOutput(BaseModel):
    """Every field here is an integration placeholder. All None until the
    Phase 3 strategy-driven model is connected — no simulated values."""

    decision: Optional[ChartAnalysisDecision] = None
    confidence: Optional[float] = None
    reasoning: Optional[str] = None
    entryZone: Optional[str] = None
    dynamicRR: Optional[str] = None
    invalidation: Optional[str] = None
    nextReview: Optional[str] = None
    learningFeedback: Optional[str] = None


class ChartAnalysis(BaseModel):
    id: int
    screenshotUrl: str
    uploadedAtUTC: str
    detection: ChartDetection
    liveContext: Optional[ChartLiveContext] = None
    aiOutput: ChartAiOutput
    # False until the Phase 3D strategy engine is wired in — the honest
    # counterpart to the design mockup's illustrative "Connected" copy.
    strategyConnected: bool = False


class ConfirmChartDetectionRequest(BaseModel):
    pair: str
    timeframe: str


class ChartAnalysisListResponse(BaseModel):
    analyses: list[ChartAnalysis]
