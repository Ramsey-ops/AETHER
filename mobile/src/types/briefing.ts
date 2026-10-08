/**
 * Mirrors backend/app/models.py. Keep these in sync by hand for now — once
 * the API surface grows past a couple of screens, generate this file from
 * the FastAPI OpenAPI schema instead of hand-maintaining it.
 */

// Shared across every screen — see "APPLICATION STATES" in the project brief.
// WAIT and NO_TRADE are legitimate outcomes, not errors.
export type TradeStatus =
  | 'BUY'
  | 'SELL'
  | 'WAIT'
  | 'NO_TRADE'
  | 'NEWS_RISK'
  | 'MONITOR'
  | 'ANALYZING'
  | 'DATA_UNAVAILABLE'

// FR-DASH-001: Trading Day Evaluation
export type DayStatus = 'TRADING_DAY' | 'WAITING_DAY' | 'NO_TRADE_DAY'

export interface Tally {
  live: number
  waiting: number
  noTrade: number
}

// FR-TIME-006 (Part 2.10): when to come back. Computed from real, fixed
// session-clock facts — not an AI prediction, so it's present even while
// aiModelConnected is false.
export interface ReturnRecommendation {
  returnAtUTC: string
  reason: string
}

// AI Decision Fusion Engine output shape (Part 2.18, FR-DEC-007/008).
// aiModelConnected is False until the Phase 3 trained model is wired in —
// the UI must render this as a preview, never as a genuine decision.
export interface DecisionSummary {
  dayStatus: DayStatus
  headline: string
  reasoning: string
  confidence: number | null
  tally: Tally
  aiModelConnected: boolean
  returnRecommendation: ReturnRecommendation | null
}

export interface SessionInfo {
  name: string
  opensAtUTC: string
  isOpen: boolean
  opensInLabel: string | null
}

export interface PairSummary {
  symbol: string
  status: TradeStatus
  confidence: number | null
  subtext: string
  nextEvent: string | null
  /** Real quote from the market data provider. Null = not configured yet
   * or the fetch failed — render as unavailable, never a placeholder number. */
  price: number | null
  changePercent: number | null
}

// Currency-only — the app never computes position sizing, so it has no
// reliable way to derive a dollar figure from R. See Screen 6 for the full
// monthly/weekly breakdown this condenses.
export interface GoalProgress {
  periodLabel: string
  targetCurrency: number
  currentCurrency: number
  note: string | null
}

export interface BriefingResponse {
  date: string
  greetingName: string
  /** Real, computed from actual UTC time — e.g. "London Session",
   * "London / New York Overlap", "Between Sessions". */
  currentSessionLabel: string
  verdict: DecisionSummary
  sessions: SessionInfo[]
  watchlistPreview: PairSummary[]
  goalProgress: GoalProgress
  /** True while any part of this response (goals, the watchlist symbol
   * list, the AI verdict) is still placeholder content. `date`,
   * `currentSessionLabel`, `sessions`, and `returnRecommendation` are real
   * regardless of this flag. */
  isMockData: boolean
  /** True once watchlist prices are real Twelve Data quotes. Independent
   * of isMockData — they now disagree, and the UI must say so precisely
   * rather than collapsing both into one "mock data" banner. */
  marketDataConnected: boolean
}
