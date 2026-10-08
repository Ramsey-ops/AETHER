import { StyleSheet, Text, View } from 'react-native'
import type { WeeklyGoalProgress } from '../../types/goals'
import { color, font, radius } from '../../theme/tokens'
import { formatCurrency, formatSignedCurrency } from '../../lib/format'

interface WeeklyGoalCardProps {
  weekly: WeeklyGoalProgress
}

export function WeeklyGoalCard({ weekly }: WeeklyGoalCardProps) {
  const hasTarget = weekly.targetCurrency > 0
  const pct = Math.min(100, Math.max(0, weekly.percent))

  return (
    <View>
      <Text style={styles.sectionLabel}>WEEKLY GOAL</Text>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.target}>{hasTarget ? `Target ${formatCurrency(weekly.targetCurrency)}` : 'No target set'}</Text>
          <Text style={[styles.achieved, { color: weekly.achievedCurrency >= 0 ? color.up : color.down }]}>
            {formatSignedCurrency(weekly.achievedCurrency)}
          </Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%`, backgroundColor: weekly.achievedCurrency >= 0 ? color.up : color.down }]} />
        </View>
        <View style={styles.daysRow}>
          {weekly.days.map((day) => (
            <View key={day.date} style={styles.dayCol}>
              <View style={[styles.dayBox, day.traded && styles.dayBoxActive]} />
              <Text style={[styles.dayLabel, day.traded && styles.dayLabelActive]}>{day.label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.note}>{weekly.note}</Text>
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
  card: {
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.16)',
    borderRadius: radius.md,
    backgroundColor: color.raised,
    padding: 15,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  target: {
    fontFamily: font.regular,
    fontSize: 13,
    color: color.text3,
  },
  achieved: {
    fontFamily: font.regular,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 6,
    borderRadius: 99,
    backgroundColor: color.track,
    marginTop: 10,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  daysRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 14,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
  },
  dayBox: {
    width: '100%',
    height: 34,
    borderRadius: 6,
    backgroundColor: color.sunken,
  },
  dayBoxActive: {
    backgroundColor: color.accent900,
    borderWidth: 1,
    borderColor: 'rgba(145, 132, 217, 0.3)',
  },
  dayLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    color: color.muted,
    marginTop: 5,
  },
  dayLabelActive: {
    color: color.accent400,
  },
  note: {
    fontFamily: font.regular,
    fontSize: 11.5,
    color: color.muted,
    marginTop: 12,
    lineHeight: 17,
  },
})
