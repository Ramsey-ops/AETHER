import './GreetingHeader.css'

interface GreetingHeaderProps {
  name: string
  /** ISO date string, e.g. "2026-08-10". */
  date: string
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function formatDateLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
    .format(d)
    .replace(',', ' ·')
}

export function GreetingHeader({ name, date }: GreetingHeaderProps) {
  return (
    <div className="greeting-header">
      <div>
        <div className="greeting-header__date">{formatDateLabel(date)}</div>
        <div className="greeting-header__title">Good morning, {name}</div>
      </div>
      <div className="greeting-header__avatar" aria-hidden="true">
        {initialsFor(name)}
      </div>
    </div>
  )
}
