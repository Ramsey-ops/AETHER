/**
 * Mirrors backend/app/models.py (ChartDetection, ChartLiveContext,
 * ChartAiOutput, ChartAnalysis). Keep in sync by hand — see the note in
 * types/briefing.ts.
 */

import type { EventImpact } from './news'

export type ChartAnalysisDecision = 'BUY' | 'SELL' | 'WAIT' | 'NO_TRADE' | 'MONITOR' | 'NEWS_RISK'

export interface ChartDetection {
  pair: string | null
  timeframe: string | null
  // "User confirmed" today — there is no vision model yet, so this is
  // never a fabricated auto-detection confidence.
  source: string | null
}

export interface ChartLiveContext {
  livePrice: number | null
  changePercent: number | null
  nextEventTitle: string | null
  nextEventInLabel: string | null
  nextEventImpact: EventImpact | null
  sentimentCurrency: string | null
  sentimentScore: number | null
}

export interface ChartAiOutput {
  decision: ChartAnalysisDecision | null
  confidence: number | null
  reasoning: string | null
  entryZone: string | null
  dynamicRR: string | null
  invalidation: string | null
  nextReview: string | null
  learningFeedback: string | null
}

export interface ChartAnalysis {
  id: number
  screenshotUrl: string
  uploadedAtUTC: string
  detection: ChartDetection
  liveContext: ChartLiveContext | null
  aiOutput: ChartAiOutput
  strategyConnected: boolean
}

export interface ChartAnalysisListResponse {
  analyses: ChartAnalysis[]
}
