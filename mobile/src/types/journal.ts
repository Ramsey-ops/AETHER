/**
 * Mirrors backend/app/models.py (TradeLogEntry, JournalStats,
 * JournalResponse, CreateTradeRequest, AddLessonRequest). Keep in sync by
 * hand — see the note in types/briefing.ts.
 *
 * Unlike every other screen, this data has no Phase 2/Phase 3 preview
 * split — it's the trader's own logged history, real from the moment it's
 * created. The one exception is `aiComment`, which stays null on every
 * trade until the Phase 3 retrospective-critique engine exists.
 */

export type TradeDirection = 'BUY' | 'SELL'

export interface TradeLogEntry {
  id: number
  symbol: string
  direction: TradeDirection
  entryPrice: number
  exitPrice: number
  stopLoss: number | null
  resultR: number
  followedPlan: boolean
  strategyTag: string | null
  notes: string | null
  screenshotUrl: string | null
  lesson: string | null
  aiComment: string | null
  sentForRetraining: boolean
  closedAtUTC: string
  createdAtUTC: string
}

export interface JournalStats {
  totalTrades: number
  winRatePercent: number | null
  avgR: number | null
  disciplinePercent: number | null
}

export interface JournalResponse {
  stats: JournalStats
  trades: TradeLogEntry[]
}

export interface CreateTradeRequest {
  symbol: string
  direction: TradeDirection
  entryPrice: number
  exitPrice: number
  stopLoss?: number | null
  resultR: number
  followedPlan?: boolean
  strategyTag?: string | null
  notes?: string | null
}
