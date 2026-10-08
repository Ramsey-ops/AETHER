import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import type { TradeStatus } from '../../types/briefing'
import { color } from '../../theme/tokens'

const DEFAULT_LABEL: Record<TradeStatus, string> = {
  BUY: 'BUY',
  SELL: 'SELL',
  WAIT: 'WAIT',
  NO_TRADE: 'NO TRADE',
  NEWS_RISK: 'NEWS RISK',
  MONITOR: 'MONITOR',
  ANALYZING: 'ANALYZING',
  DATA_UNAVAILABLE: 'DATA UNAVAILABLE',
}

interface StatusPillProps {
  status: TradeStatus
  /** Overrides the default label (e.g. "Analyzing today's market…"). */
  label?: string
}

/**
 * Renders any of the eight states every screen must support (see
 * "APPLICATION STATES" in the project brief). WAIT and NO_TRADE are
 * legitimate outcomes, not errors — they get neutral, not alarming, styling.
 */
export function StatusPill({ status, label }: StatusPillProps) {
  const text = label ?? DEFAULT_LABEL[status]
  const variant = variants[status]

  return (
    <View style={[styles.base, variant.pill]}>
      {status === 'ANALYZING' && (
        <ActivityIndicator size="small" color={variant.text.color} style={styles.spinner} />
      )}
      <Text style={[styles.text, variant.text]}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  text: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  spinner: {
    transform: [{ scale: 0.7 }],
  },
})

const variants: Record<TradeStatus, { pill: object; text: { color: string } }> = {
  BUY: {
    pill: { backgroundColor: 'rgba(107, 168, 124, 0.18)', borderColor: 'rgba(143, 206, 159, 0.35)' },
    text: { color: color.up },
  },
  SELL: {
    pill: { backgroundColor: 'rgba(160, 80, 80, 0.16)', borderColor: 'rgba(214, 138, 138, 0.35)' },
    text: { color: color.down },
  },
  WAIT: {
    pill: { borderColor: 'rgba(233, 233, 237, 0.2)' },
    text: { color: color.text2 },
  },
  NO_TRADE: {
    pill: { borderColor: 'rgba(233, 233, 237, 0.18)', opacity: 0.85 },
    text: { color: color.text3 },
  },
  NEWS_RISK: {
    pill: { backgroundColor: 'rgba(160, 80, 80, 0.16)', borderColor: 'rgba(214, 138, 138, 0.4)' },
    text: { color: color.down },
  },
  MONITOR: {
    pill: { borderColor: 'rgba(145, 132, 217, 0.5)' },
    text: { color: color.accent300 },
  },
  ANALYZING: {
    pill: { borderColor: 'rgba(233, 233, 237, 0.16)' },
    text: { color: color.text3 },
  },
  DATA_UNAVAILABLE: {
    pill: { borderColor: 'rgba(233, 233, 237, 0.22)', borderStyle: 'dashed' },
    text: { color: color.dim },
  },
}
