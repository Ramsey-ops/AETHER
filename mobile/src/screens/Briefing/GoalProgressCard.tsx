import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { GoalProgress } from '../../types/briefing'
import { color, font, radius } from '../../theme/tokens'
import { formatCurrency } from '../../lib/format'

interface GoalProgressCardProps {
  goal: GoalProgress
}

/** FR-GOAL-002: goal progress display (Part 2.10). Condensed currency view;
 * the full weekly/monthly breakdown lives on Screen 6. */
export function GoalProgressCard({ goal }: GoalProgressCardProps) {
  const pct = goal.targetCurrency > 0 ? Math.min(100, Math.round((goal.currentCurrency / goal.targetCurrency) * 100)) : 0

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.label}>{goal.periodLabel}</Text>
        <Text style={styles.value}>
          {goal.targetCurrency > 0
            ? `${formatCurrency(goal.currentCurrency)} of ${formatCurrency(goal.targetCurrency)}`
            : 'No target set'}
        </Text>
      </View>
      <View style={styles.track}>
        <LinearGradient
          colors={[color.accent700, color.accent400]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${pct}%` }]}
        />
      </View>
      {goal.note && <Text style={styles.note}>{goal.note}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginTop: 22,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.12)',
    borderRadius: radius.md,
    backgroundColor: color.raised,
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: font.regular,
    fontSize: 12.5,
    color: color.text3,
  },
  value: {
    fontFamily: font.regular,
    fontSize: 12.5,
    color: color.text,
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
  note: {
    fontFamily: font.regular,
    fontSize: 12,
    color: color.muted,
    marginTop: 9,
  },
})
