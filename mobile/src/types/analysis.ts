/**
 * Mirrors backend/app/models.py (the PairAnalysisResponse family). Keep in
 * sync by hand — see the note in types/briefing.ts.
 */

import type { TradeStatus } from './briefing'

export interface Candle {
  timeUTC: string
  close: number
}

export type TimeframeBias = 'Bullish' | 'Bearish' | 'Neutral' | 'Setup' | 'Confirmed' | 'Pending'

export interface TimeframeAlignmentRow {
  timeframe: string
  note: string
  bias: TimeframeBias
}

export interface AnalysisLevels {
  entryZoneLow: number
  entryZoneHigh: number
  stopLoss: number
  takeProfit1: number
  takeProfit2: number
  riskRewardRatio: string
  note: string
}

export type ReasoningKind = 'confirm' | 'caution' | 'news'

export interface ReasoningPoint {
  text: string
  kind: ReasoningKind
}

// Screen 2 — Pair Analysis. price/changePercent/candles are real market
// data once marketDataConnected is true. recommendation/confidence/
// timeframeAlignment/levels/reasoning are Phase 3 AI-socket content and
// stay behind aiModelConnected=false until the trained model is wired in.
export interface PairAnalysisResponse {
  symbol: string
  displayName: string
  updatedAtUTC: string
  availableTimeframes: string[]
  selectedTimeframe: string

  price: number | null
  changePercent: number | null
  candles: Candle[]
  marketDataConnected: boolean

  recommendation: TradeStatus
  confidence: number | null
  recommendationNote: string
  timeframeAlignment: TimeframeAlignmentRow[]
  levels: AnalysisLevels | null
  reasoning: ReasoningPoint[]
  riskWarning: string | null
  aiModelConnected: boolean
}
