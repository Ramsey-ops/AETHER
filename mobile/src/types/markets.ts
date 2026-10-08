/**
 * Mirrors backend/app/models.py (MarketPair, MarketsResponse). Keep in sync
 * by hand — see the note in types/briefing.ts.
 */

import type { TradeStatus } from './briefing'
import type { Candle } from './analysis'

export interface MarketPair {
  symbol: string
  displayName: string
  status: TradeStatus
  confidence: number | null
  subtext: string
  nextEvent: string | null
  price: number | null
  changePercent: number | null
  candles: Candle[]
}

export interface MarketsResponse {
  pairs: MarketPair[]
  marketDataConnected: boolean
  // TradingView sync (Part 2.4) isn't connected yet — this list is a fixed
  // preview set, not a real synced watchlist.
  tradingViewConnected: boolean
  syncNote: string
}
