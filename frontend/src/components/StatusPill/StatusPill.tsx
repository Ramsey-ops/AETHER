import type { TradeStatus } from '../../types/briefing'
import './StatusPill.css'

const DEFAULT_LABEL: Record<TradeStatus, string> = {
  BUY: 'BUY',
  SELL: 'SELL',
  WAIT: 'WAIT',
  NO_TRADE: 'NO TRADE',
  NEWS_RISK: 'NEWS RISK',
  MONITOR: 'MONITOR',
  ANALYZING: 'ANALYZING',
  DATA_UNAVAILABLE: 'DATA UNAVAILABLE',
}

interface StatusPillProps {
  status: TradeStatus
  /** Overrides the default label (e.g. "BUY forming" instead of "BUY"). */
  label?: string
}

/**
 * Renders any of the eight states every screen must support (see
 * "APPLICATION STATES" in the project brief). WAIT and NO_TRADE are
 * legitimate outcomes, not errors — they get neutral, not alarming, styling.
 */
export function StatusPill({ status, label }: StatusPillProps) {
  const text = label ?? DEFAULT_LABEL[status]
  const className = `status-pill status-pill--${status.toLowerCase().replace('_', '-')}`
  return (
    <span className={className}>
      {status === 'ANALYZING' && <span className="status-pill__spinner" aria-hidden="true" />}
      {text}
    </span>
  )
}
