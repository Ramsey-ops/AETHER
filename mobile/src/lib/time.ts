/**
 * Session and return-time facts come from the backend in UTC — that's how
 * forex sessions are actually defined, and keeps the server timezone-free.
 * The trader shouldn't have to do the UTC conversion in their head, so
 * every display in the app converts to the device's own local timezone
 * here. `Date`/`Intl` resolve "local" from the phone's system timezone —
 * no location permission needed, and it updates automatically if the
 * trader travels.
 */

/** The next real-world instant a UTC "HH:MM" time-of-day occurs (today if
 * still ahead, otherwise tomorrow). Used for scheduling — always a concrete
 * future moment, never just a display string. */
export function nextUtcOccurrence(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number)
  const now = new Date()
  const target = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m, 0, 0),
  )
  if (target.getTime() <= now.getTime()) {
    target.setUTCDate(target.getUTCDate() + 1)
  }
  return target
}

/** A UTC "HH:MM" time-of-day, formatted as the trader's local wall-clock
 * time (e.g. "08:00" UTC -> "3:00 AM" for a UTC-5 device). For display
 * only — doesn't matter whether the underlying instant is today or
 * tomorrow, since a time-of-day repeats daily. */
export function formatUtcHHMMAsLocal(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const now = new Date()
  const asToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  asToday.setUTCHours(h, m, 0, 0)
  return asToday.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

/** A full ISO-8601 instant (e.g. a `updatedAtUTC` timestamp), formatted as
 * the trader's local wall-clock time. Unlike formatUtcHHMMAsLocal this
 * carries a real date, so no "is it today" ambiguity to resolve. */
export function formatIsoAsLocalTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

/** A Twelve Data candle timestamp ("YYYY-MM-DD HH:MM:SS", UTC) formatted as
 * a short local time label for chart axes. */
export function formatCandleTimeAsLocal(timeUTC: string): string {
  const iso = timeUTC.includes('T') ? timeUTC : `${timeUTC.replace(' ', 'T')}Z`
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}
