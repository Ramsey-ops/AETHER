import type { DecisionSummary } from '../../types/briefing'
import './VerdictCard.css'

interface VerdictCardProps {
  verdict: DecisionSummary
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

/**
 * The AI Decision Fusion Engine's headline output (Part 2.18): the day's
 * verdict, the reasoning behind it, and a tally of how many watchlist pairs
 * are live / waiting / ruled out. WAIT is rendered with the same visual
 * weight as BUY — it's a legitimate outcome, not a fallback.
 */
export function VerdictCard({ verdict }: VerdictCardProps) {
  return (
    <div className="verdict-card">
      <div className="verdict-card__kicker">
        <i className="ph ph-hourglass-medium" aria-hidden="true" />
        Verdict for today
      </div>
      <div className="verdict-card__headline">{verdict.headline}</div>
      <p className="verdict-card__reasoning">{verdict.reasoning}</p>
      <div className="verdict-card__tally">
        {verdict.tally.live > 0 && (
          <span className="verdict-card__chip verdict-card__chip--live">
            {pluralize(verdict.tally.live, 'setup')} live
          </span>
        )}
        {verdict.tally.waiting > 0 && (
          <span className="verdict-card__chip">{pluralize(verdict.tally.waiting, 'setup')} waiting</span>
        )}
        {verdict.tally.noTrade > 0 && (
          <span className="verdict-card__chip">{pluralize(verdict.tally.noTrade, 'setup')} no trade</span>
        )}
      </div>
    </div>
  )
}
