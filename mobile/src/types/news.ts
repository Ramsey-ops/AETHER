/**
 * Mirrors backend/app/models.py (CalendarEvent, NextHighImpact,
 * CurrencySentiment, Headline, NewsResponse). Keep in sync by hand — see
 * the note in types/briefing.ts.
 */

export type EventImpact = 'low' | 'medium' | 'high'

export interface CalendarEvent {
  timeUTC: string
  title: string
  currency: string
  impact: EventImpact
  forecast: string | null
  previous: string | null
  affectedPairs: string[]
  note: string | null
}

export interface NextHighImpact {
  event: CalendarEvent
  // Real countdown to the event's clock time, computed the same way as
  // ReturnRecommendation.
  inLabel: string
}

export type SentimentLabel = 'Bullish' | 'Bearish' | 'Neutral'

export interface CurrencySentiment {
  currency: string
  score: number
}

// AI's judgment of whether a headline helps or hurts the trader's setups on
// the four watchlist pairs. Distinct from `impact` (deterministic severity
// classification) — only ever set by the server's interpretation layer.
export type TradeImpact = 'in_favor' | 'not_in_favor' | 'neutral' | 'news_risk'

export interface Headline {
  text: string
  currencyTag: string
  sentimentLabel: SentimentLabel
  sentimentScore: number
  timeAgoLabel: string

  // FACT fields — sourced directly from the publisher.
  source: string
  url: string | null
  summary: string | null
  affectedAssets: string[]
  impact: EventImpact

  // AI INTERPRETATION fields — Claude/Gemini reasoning about the FACT
  // fields above, never certain. All null until aiInterpreted is true.
  aiInterpreted: boolean
  rootCause: string | null
  marketImplication: string | null
  tradeImpact: TradeImpact | null
  // One-sentence institutional-desk-note read for the "AETHER INSTITUTIONAL
  // TAKE" card — still AI interpretation, just phrased for display.
  institutionalTake: string | null
}

export interface NewsResponse {
  date: string
  nextHighImpact: NextHighImpact | null
  calendar: CalendarEvent[]
  sentiment: CurrencySentiment[]
  headlines: Headline[]
  // True when `calendar` came from the live FairEconomy feed; false when it
  // fell back to the fixed preview fixture (feed unreachable/rate-limited).
  economicCalendarConnected: boolean
  // True once at least one live news source contributed headlines.
  newsConnected: boolean
  // Exactly which live sources contributed this response (e.g. "Finnhub",
  // "Alpha Vantage", "Marketaux", "RSS (ForexLive/FXStreet)").
  newsSourcesConnected: string[]
  // True once the AI interpretation layer (Gemini/Claude) ran successfully
  // for this batch — independent of newsConnected.
  aiInterpretationConnected: boolean
}
