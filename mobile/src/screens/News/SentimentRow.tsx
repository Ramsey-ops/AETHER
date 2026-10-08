import { StyleSheet, Text, View } from 'react-native'
import type { CurrencySentiment } from '../../types/news'
import { color, font, radius } from '../../theme/tokens'

interface SentimentRowProps {
  sentiment: CurrencySentiment[]
}

function colorForScore(score: number): string {
  if (score > 0.05) return color.up
  if (score < -0.05) return color.down
  return color.text2
}

export function SentimentRow({ sentiment }: SentimentRowProps) {
  if (sentiment.length === 0) return null

  return (
    <View>
      <Text style={styles.sectionLabel}>SENTIMENT NOW</Text>
      <View style={styles.row}>
        {sentiment.map((s) => (
          <View key={s.currency} style={styles.card}>
            <Text style={styles.currency}>{s.currency}</Text>
            <Text style={[styles.score, { color: colorForScore(s.score) }]}>
              {s.score >= 0 ? '+' : ''}
              {s.score.toFixed(2)}
            </Text>
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
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.12)',
    borderRadius: radius.md,
    backgroundColor: color.raised,
    padding: 12,
  },
  currency: {
    fontFamily: font.regular,
    fontSize: 12,
    color: color.muted,
  },
  score: {
    fontFamily: font.regular,
    fontSize: 17,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
})
