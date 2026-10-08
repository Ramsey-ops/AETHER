import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { MonthlyGoalProgress } from '../../types/goals'
import { color, font, radius } from '../../theme/tokens'
import { formatCurrency, formatSignedCurrency } from '../../lib/format'

interface MonthlyGoalCardProps {
  monthly: MonthlyGoalProgress
}

export function MonthlyGoalCard({ monthly }: MonthlyGoalCardProps) {
  const hasTarget = monthly.targetCurrency > 0
  const pct = Math.min(100, Math.max(0, monthly.percent))

  return (
    <View>
      <Text style={styles.sectionLabel}>ACCOUNT GOAL · {monthly.periodLabel.toUpperCase()}</Text>
      <LinearGradient
        colors={['rgba(66, 58, 106, 0.5)', 'rgba(35, 37, 50, 0.72)']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.card}
      >
        <View style={styles.headerRow}>
          <Text style={styles.kicker}>
            {hasTarget ? `Profit target ${formatCurrency(monthly.targetCurrency)}` : 'No target set yet'}
          </Text>
          <Text style={styles.daysLeft}>{monthly.daysLeftInMonth} days left</Text>
        </View>

        {hasTarget ? (
          <>
            <View style={styles.achievedRow}>
              <Text style={[styles.achievedValue, { color: monthly.achievedCurrency >= 0 ? color.up : color.down }]}>
                {formatSignedCurrency(monthly.achievedCurrency)}
              </Text>
              <Text style={styles.achievedLabel}>achieved</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct}%` }]} />
            </View>
            <View style={styles.remainingRow}>
              <Text style={styles.remainingLabel}>
                Remaining <Text style={styles.remainingValue}>{formatSignedCurrency(monthly.remainingCurrency)}</Text>
              </Text>
              <Text style={styles.percent}>{Math.round(monthly.percent)}%</Text>
            </View>
            <View style={styles.divider} />
          </>
        ) : null}

        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Starting</Text>
            <Text style={styles.balanceValue}>{formatCurrency(monthly.startingBalance)}</Text>
          </View>
          <View>
            <Text style={styles.balanceLabel}>Current</Text>
            <Text style={styles.balanceValue}>{formatCurrency(monthly.currentBalance)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.balanceLabel}>Target</Text>
            <Text style={styles.balanceValue}>
              {hasTarget ? formatCurrency(monthly.startingBalance + monthly.targetCurrency) : '—'}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    letterSpacing: 1.4,
    color: color.muted,
    marginBottom: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: 'rgba(145, 132, 217, 0.42)',
    borderRadius: radius.md,
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kicker: {
    fontFamily: font.regular,
    fontSize: 11,
    letterSpacing: 1.4,
    color: color.accent400,
    flexShrink: 1,
  },
  daysLeft: {
    fontFamily: font.regular,
    fontSize: 12,
    color: color.text3,
  },
  achievedRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 12,
    marginBottom: 2,
  },
  achievedValue: {
    fontFamily: font.medium,
    fontSize: 34,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  achievedLabel: {
    fontFamily: font.regular,
    fontSize: 14,
    color: color.text3,
  },
  track: {
    height: 8,
    borderRadius: 99,
    backgroundColor: 'rgba(233, 233, 237, 0.12)',
    marginTop: 12,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: color.accent400,
  },
  remainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 9,
  },
  remainingLabel: {
    fontFamily: font.regular,
    fontSize: 12,
    color: color.text3,
  },
  remainingValue: {
    fontFamily: font.regular,
    fontSize: 12,
    color: color.text,
    fontVariant: ['tabular-nums'],
  },
  percent: {
    fontFamily: font.regular,
    fontSize: 12,
    color: color.accent300,
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(233, 233, 237, 0.14)',
    marginTop: 15,
    marginBottom: 13,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  balanceLabel: {
    fontFamily: font.regular,
    fontSize: 11.5,
    color: color.muted,
  },
  balanceValue: {
    fontFamily: font.regular,
    fontSize: 15,
    color: color.text,
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
})
