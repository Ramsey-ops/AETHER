import type { GoalProgress } from '../../types/briefing'
import './GoalProgressCard.css'

interface GoalProgressCardProps {
  goal: GoalProgress
}

/** FR-GOAL-002: goal progress display (Part 2.10). Condensed R-based view; the full
 * currency + weekly/monthly breakdown lives on Screen 6. */
export function GoalProgressCard({ goal }: GoalProgressCardProps) {
  const pct = Math.min(100, Math.round((goal.currentR / goal.targetR) * 100))

  return (
    <div className="goal-progress-card">
      <div className="goal-progress-card__row">
        <span>{goal.periodLabel}</span>
        <span className="goal-progress-card__value">
          {goal.currentR}R of {goal.targetR}R
        </span>
      </div>
      <div className="goal-progress-card__track">
        <div className="goal-progress-card__fill" style={{ width: `${pct}%` }} />
      </div>
      {goal.note && <div className="goal-progress-card__note">{goal.note}</div>}
    </div>
  )
}
