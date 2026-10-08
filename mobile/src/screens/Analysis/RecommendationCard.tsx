import { StyleSheet, Text, View } from 'react-native'
import type { TradeStatus } from '../../types/briefing'
import { color, font, radius } from '../../theme/tokens'
import { ConfidenceRing } from './ConfidenceRing'

interface RecommendationCardProps {
  recommendation: TradeStatus
  confidence: number | null
  note: string
}

const RECOMMENDATION_LABEL: Record<TradeStatus, string> = {
  BUY: 'BUY',
  SELL: 'SELL',
  WAIT: 'WAIT',
  NO_TRADE: 'NO TRADE',
  NEWS_RISK: 'NEWS RISK',
  MONITOR: 'MONITOR',
  ANALYZING: 'ANALYZING',
  DATA_UNAVAILABLE: 'UNAVAILABLE',
}

const VARIANT: Record<TradeStatus, { border: string; wash: string; text: string; ring: string }> = {
  BUY: { border: 'rgba(143,206,159,0.4)', wash: 'rgba(45,74,55,0.5)', text: color.up, ring: color.up },
  SELL: { border: 'rgba(214,138,138,0.4)', wash: 'rgba(74,42,42,0.45)', text: color.down, ring: color.down },
  NEWS_RISK: { border: 'rgba(214,138,138,0.4)', wash: 'rgba(74,42,42,0.45)', text: color.down, ring: color.down },
  WAIT: { border: 'rgba(233,233,237,0.16)', wash: color.raised, text: color.text2, ring: color.accent400 },
  NO_TRADE: { border: 'rgba(233,233,237,0.14)', wash: color.raised, text: color.text3, ring: color.dim },
  MONITOR: { border: 'rgba(145,132,217,0.4)', wash: color.raised, text: color.accent300, ring: color.accent400 },
  ANALYZING: { border: 'rgba(233,233,237,0.16)', wash: color.raised, text: color.text3, ring: color.dim },
  DATA_UNAVAILABLE: { border: 'rgba(233,233,237,0.16)', wash: color.raised, text: color.dim, ring: color.dim },
}

/**
 * Screen 2's recommendation ring + verdict. This is the Phase 3 AI socket
 * (Part 2.18) — the caller wraps it with a "preview" badge whenever
 * aiModelConnected is false, same convention as VerdictCard on Screen 1.
 */
export function RecommendationCard({ recommendation, confidence, note }: RecommendationCardProps) {
  const variant = VARIANT[recommendation]

  return (
    <View style={[styles.card, { borderColor: variant.border, backgroundColor: variant.wash }]}>
      <ConfidenceRing confidence={confidence} ringColor={variant.ring} />
      <View style={styles.textCol}>
        <Text style={[styles.label, { color: variant.text }]}>RECOMMENDATION</Text>
        <Text style={styles.value}>{RECOMMENDATION_LABEL[recommendation]}</Text>
        <Text style={styles.note}>{note}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 16,
  },
  textCol: {
    flex: 1,
  },
  label: {
    fontFamily: font.regular,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  value: {
    fontFamily: font.medium,
    fontSize: 30,
    color: color.text,
    letterSpacing: -0.4,
    marginTop: 4,
    marginBottom: 6,
  },
  note: {
    fontFamily: font.regular,
    fontSize: 12.5,
    color: color.text2,
    lineHeight: 18,
  },
})
