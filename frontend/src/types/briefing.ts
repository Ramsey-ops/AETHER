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

// AI Decision Fusion Engine output shape (Part 2.18, FR-DEC-007/008).
export interface DecisionSummary {
  dayStatus: DayStatus
  headline: string
  reasoning: string
  confidence: number | null
  tally: Tally
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
}

export interface GoalProgress {
  periodLabel: string
  targetR: number
  currentR: number
  currencyTarget: number | null
  currencyCurrent: number | null
  note: string | null
}

export interface BriefingResponse {
  date: string
  greetingName: string
  verdict: DecisionSummary
  sessions: SessionInfo[]
  watchlistPreview: PairSummary[]
  goalProgress: GoalProgress
  isMockData: boolean
}
