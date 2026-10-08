import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { HourglassMediumIcon } from 'phosphor-react-native'
import type { DecisionSummary } from '../../types/briefing'
import { color, font, radius } from '../../theme/tokens'
import { ReturnTimeCard } from './ReturnTimeCard'

interface VerdictCardProps {
  verdict: DecisionSummary
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

/**
 * The AI Decision Fusion Engine's headline output (Part 2.18): the day's
 * verdict, the reasoning behind it, and a tally of how many watchlist pairs
 * are live / waiting / ruled out. WAIT is rendered with the same visual
 * weight as BUY — it's a legitimate outcome, not a fallback.
 */
export function VerdictCard({ verdict }: VerdictCardProps) {
  return (
    <LinearGradient
      colors={['rgba(66, 58, 106, 0.55)', 'rgba(35, 37, 50, 0.7)']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.card}
    >
      <View style={styles.kicker}>
        <HourglassMediumIcon size={15} color={color.accent400} />
        <Text style={styles.kickerText}>VERDICT FOR TODAY</Text>
      </View>
      {!verdict.aiModelConnected && (
        <View style={styles.aiPendingBadge}>
          <Text style={styles.aiPendingText}>PREVIEW — AI MODEL NOT YET CONNECTED</Text>
        </View>
      )}
      <Text style={styles.headline}>{verdict.headline}</Text>
      <Text style={styles.reasoning}>{verdict.reasoning}</Text>
      <View style={styles.tally}>
        {verdict.tally.live > 0 && (
          <View style={[styles.chip, styles.chipLive]}>
            <Text style={[styles.chipText, styles.chipTextLive]}>
              {pluralize(verdict.tally.live, 'setup')} live
            </Text>
          </View>
        )}
        {verdict.tally.waiting > 0 && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{pluralize(verdict.tally.waiting, 'setup')} waiting</Text>
          </View>
        )}
        {verdict.tally.noTrade > 0 && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{pluralize(verdict.tally.noTrade, 'setup')} no trade</Text>
          </View>
        )}
      </View>
      {verdict.returnRecommendation && <ReturnTimeCard recommendation={verdict.returnRecommendation} />}
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: 'rgba(145, 132, 217, 0.42)',
    borderRadius: radius.md,
    padding: 18,
  },
  kicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kickerText: {
    fontFamily: font.regular,
    fontSize: 11,
    letterSpacing: 1.7,
    color: color.accent400,
  },
  aiPendingBadge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(233, 233, 237, 0.22)',
  },
  aiPendingText: {
    fontFamily: font.regular,
    fontSize: 9.5,
    letterSpacing: 0.6,
    color: color.dim,
  },
  headline: {
    fontFamily: font.medium,
    fontSize: 32,
    color: color.text,
    marginTop: 10,
    marginBottom: 6,
  },
  reasoning: {
    fontFamily: font.regular,
    fontSize: 14,
    lineHeight: 22,
    color: color.text2,
  },
  tally: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.16)',
  },
  chipText: {
    fontFamily: font.regular,
    fontSize: 12,
    color: color.text3,
  },
  chipLive: {
    borderColor: 'rgba(145, 132, 217, 0.5)',
  },
  chipTextLive: {
    color: color.accent300,
  },
})
