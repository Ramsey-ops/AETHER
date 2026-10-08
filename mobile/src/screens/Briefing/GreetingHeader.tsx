import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { color, font } from '../../theme/tokens'

interface GreetingHeaderProps {
  name: string
  /** e.g. "London Session", "London / New York Overlap", "Between Sessions". */
  currentSessionLabel: string
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

/** Ticks on the device's own real clock, in the trader's local timezone —
 * independent of the backend response, so it never goes stale between
 * refreshes and never needs a UTC round-trip for something this local. */
function useLocalClock(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

export function GreetingHeader({ name, currentSessionLabel }: GreetingHeaderProps) {
  const now = useLocalClock()
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })
    .format(now)
    .replace(',', ' ·')
    .toUpperCase()
  const timeLabel = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.date}>
          {dateLabel} · {currentSessionLabel}
        </Text>
        <Text style={styles.title}>Good morning, {name}</Text>
      </View>
      <View style={styles.right}>
        <View style={styles.clockBox}>
          <Text style={styles.clockLabel}>LOCAL TIME</Text>
          <Text style={styles.clockValue}>{timeLabel}</Text>
        </View>
        <LinearGradient
          colors={[color.accent800, color.surface]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{initialsFor(name)}</Text>
        </LinearGradient>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  left: {
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  date: {
    fontFamily: font.regular,
    fontSize: 12,
    letterSpacing: 1,
    color: color.muted,
  },
  title: {
    fontFamily: font.medium,
    fontSize: 26,
    color: color.text,
    marginTop: 4,
  },
  clockBox: {
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.14)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: color.raised,
  },
  clockLabel: {
    fontFamily: font.regular,
    fontSize: 8.5,
    letterSpacing: 0.8,
    color: color.muted,
  },
  clockValue: {
    fontFamily: font.semibold,
    fontSize: 15,
    color: color.text,
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: font.regular,
    fontSize: 13,
    color: color.accent300,
  },
})
