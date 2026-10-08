import { StyleSheet, Text, View } from 'react-native'
import type { ChartLiveContext } from '../../types/chartAnalysis'
import { color, font, radius } from '../../theme/tokens'
import { formatFxPrice } from '../../lib/format'

interface LiveContextGridProps {
  pair: string
  context: ChartLiveContext
}

function sentimentColor(score: number | null): string {
  if (score == null) return color.text3
  if (score > 0.05) return color.up
  if (score < -0.05) return color.down
  return color.text2
}

export function LiveContextGrid({ pair, context }: LiveContextGridProps) {
  return (
    <View>
      <Text style={styles.sectionLabel}>LIVE DATA · NOT AI OUTPUT</Text>
      <View style={styles.grid}>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Live price</Text>
          <Text style={styles.cellValue}>
            {context.livePrice != null ? formatFxPrice(pair, context.livePrice) : 'Unavailable'}
          </Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Change today</Text>
          <Text
            style={[
              styles.cellValue,
              context.changePercent != null && { color: context.changePercent >= 0 ? color.up : color.down },
            ]}
          >
            {context.changePercent != null
              ? `${context.changePercent >= 0 ? '+' : ''}${context.changePercent.toFixed(2)}%`
              : 'Unavailable'}
          </Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Next event</Text>
          <Text style={styles.cellValue} numberOfLines={1}>
            {context.nextEventTitle ? `${context.nextEventTitle}${context.nextEventInLabel ? ` · ${context.nextEventInLabel}` : ''}` : 'None today'}
          </Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>{context.sentimentCurrency ?? 'Currency'} sentiment</Text>
          <Text style={[styles.cellValue, { color: sentimentColor(context.sentimentScore) }]}>
            {context.sentimentScore != null ? context.sentimentScore.toFixed(2) : 'Unavailable'}
          </Text>
        </View>
      </View>
      <Text style={styles.footnote}>
        Values above are retrieved market data. Anything the AI concludes appears separately, labelled as
        interpretation.
      </Text>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.12)',
    borderRadius: radius.md,
    backgroundColor: color.raised,
    padding: 12,
  },
  cellLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    color: color.muted,
  },
  cellValue: {
    fontFamily: font.medium,
    fontSize: 15,
    color: color.text,
    marginTop: 3,
  },
  footnote: {
    fontFamily: font.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: color.dim,
    marginTop: 10,
  },
})
