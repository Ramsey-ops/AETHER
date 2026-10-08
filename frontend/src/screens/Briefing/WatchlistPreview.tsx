import type { PairSummary } from '../../types/briefing'
import { StatusPill } from '../../components/StatusPill/StatusPill'
import './WatchlistPreview.css'

interface WatchlistPreviewProps {
  pairs: PairSummary[]
}

/**
 * Condensed, read-only summary of the user's TradingView-synced watchlist
 * (Part 2.4). The full watchlist — search, reorder, per-pair settings — is
 * Screen 3; this only surfaces enough to answer "what needs my attention."
 */
export function WatchlistPreview({ pairs }: WatchlistPreviewProps) {
  return (
    <section>
      <div className="watchlist-preview__header">
        <div className="watchlist-preview__label">Your watchlist</div>
        <span className="watchlist-preview__sort">Sorted by conviction</span>
      </div>
      <div className="watchlist-preview__list">
        {pairs.map((pair) => (
          <div key={pair.symbol} className="watchlist-preview__row" data-status={pair.status}>
            <div className="watchlist-preview__main">
              <div className="watchlist-preview__symbol-row">
                <span className="watchlist-preview__symbol">{pair.symbol}</span>
                <StatusPill status={pair.status} />
              </div>
              <div className="watchlist-preview__subtext">{pair.subtext}</div>
            </div>
            {pair.confidence != null && (
              <div className="watchlist-preview__confidence">
                <div className="watchlist-preview__confidence-value">{pair.confidence}</div>
                <div className="watchlist-preview__confidence-label">CONF</div>
              </div>
            )}
            <i className="ph ph-caret-right watchlist-preview__chevron" aria-hidden="true" />
          </div>
        ))}
      </div>
    </section>
  )
}
