import type { SessionInfo } from '../../types/briefing'
import './SessionsStrip.css'

interface SessionsStripProps {
  sessions: SessionInfo[]
}

export function SessionsStrip({ sessions }: SessionsStripProps) {
  const nextHint = sessions.find((s) => s.opensInLabel)

  return (
    <section>
      <div className="sessions-strip__header">
        <div className="sessions-strip__label">Sessions</div>
        {nextHint && (
          <div className="sessions-strip__hint">
            {nextHint.name} opens in {nextHint.opensInLabel}
          </div>
        )}
      </div>
      <div className="sessions-strip__grid">
        {sessions.map((session) => (
          <div
            key={session.name}
            className="sessions-strip__cell"
            data-open={session.isOpen}
            data-next={session === nextHint}
          >
            <div className="sessions-strip__name">{session.name}</div>
            <div className="sessions-strip__time">{session.isOpen ? 'Open' : session.opensAtUTC}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
