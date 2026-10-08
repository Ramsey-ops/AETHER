import { StyleSheet, Text, View } from 'react-native'
import type { CalendarEvent, EventImpact } from '../../types/news'
import { color, font } from '../../theme/tokens'
import { formatUtcHHMMAsLocal } from '../../lib/time'

interface CalendarListProps {
  events: CalendarEvent[]
}

const IMPACT_COLOR: Record<EventImpact, string> = {
  low: color.neutral800,
  medium: color.caution,
  high: color.downStrong,
}

export function CalendarList({ events }: CalendarListProps) {
  return (
    <View>
      <Text style={styles.sectionLabel}>TODAY'S CALENDAR</Text>
      <View style={styles.table}>
        {events.map((event, i) => (
          <View key={i} style={[styles.row, event.impact === 'high' && styles.rowHighlighted]}>
            <Text style={[styles.time, event.impact === 'high' && styles.timeHighlighted]}>
              {formatUtcHHMMAsLocal(event.timeUTC)}
            </Text>
            <View style={styles.textCol}>
              <Text style={styles.title}>{event.title}</Text>
              <Text style={styles.currency}>
                {event.currency}
                {event.impact === 'high' ? ' · high impact' : ''}
                {(event.forecast || event.previous) ? '  ·  ' : ''}
                {event.forecast ? `f: ${event.forecast}` : ''}
                {event.forecast && event.previous ? '  ' : ''}
                {event.previous ? `prev: ${event.previous}` : ''}
              </Text>
            </View>
            <View style={[styles.impactBar, { backgroundColor: IMPACT_COLOR[event.impact] }]} />
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    letterSpacing: 1.4,
    color: color.muted,
    marginTop: 22,
    marginBottom: 10,
  },
  table: {
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.12)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    backgroundColor: color.raised,
  },
  rowHighlighted: {
    backgroundColor: color.surface,
  },
  time: {
    width: 42,
    fontFamily: font.regular,
    fontSize: 12.5,
    color: color.muted,
    fontVariant: ['tabular-nums'],
  },
  timeHighlighted: {
    color: color.text,
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontFamily: font.regular,
    fontSize: 13.5,
    color: color.text,
  },
  currency: {
    fontFamily: font.regular,
    fontSize: 11.5,
    color: color.muted,
    marginTop: 2,
  },
  impactBar: {
    width: 26,
    height: 4,
    borderRadius: 99,
  },
})
