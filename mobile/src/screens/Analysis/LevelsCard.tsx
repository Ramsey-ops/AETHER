import { StyleSheet, Text, View } from 'react-native'
import type { AnalysisLevels } from '../../types/analysis'
import { color, font, radius } from '../../theme/tokens'
import { formatFxPrice } from '../../lib/format'

interface LevelsCardProps {
  levels: AnalysisLevels
  symbol: string
}

export function LevelsCard({ levels, symbol }: LevelsCardProps) {
  return (
    <View>
      <Text style={styles.sectionLabel}>LEVELS &amp; DYNAMIC R:R</Text>
      <View style={styles.card}>
        <View style={styles.grid}>
          <View style={styles.cell}>
            <Text style={styles.cellLabel}>Entry zone</Text>
            <Text style={styles.cellValue}>
              {formatFxPrice(symbol, levels.entryZoneLow)} – {formatFxPrice(symbol, levels.entryZoneHigh)}
            </Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.cellLabel}>Stop loss</Text>
            <Text style={[styles.cellValue, { color: color.down }]}>{formatFxPrice(symbol, levels.stopLoss)}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.cellLabel}>Take profit 1</Text>
            <Text style={[styles.cellValue, { color: color.up }]}>{formatFxPrice(symbol, levels.takeProfit1)}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.cellLabel}>Take profit 2</Text>
            <Text style={[styles.cellValue, { color: color.up }]}>{formatFxPrice(symbol, levels.takeProfit2)}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.rrRow}>
          <Text style={styles.rrLabel}>Dynamic risk-to-reward</Text>
          <Text style={styles.rrValue}>{levels.riskRewardRatio}</Text>
        </View>
        <Text style={styles.note}>{levels.note}</Text>
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
    borderColor: 'rgba(233, 233, 237, 0.12)',
    borderRadius: radius.md,
    backgroundColor: color.raised,
    padding: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  cell: {
    width: '46%',
  },
  cellLabel: {
    fontFamily: font.regular,
    fontSize: 11.5,
    color: color.muted,
  },
  cellValue: {
    fontFamily: font.regular,
    fontSize: 15,
    color: color.text,
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(233, 233, 237, 0.12)',
    marginVertical: 14,
  },
  rrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rrLabel: {
    fontFamily: font.regular,
    fontSize: 12.5,
    color: color.text3,
  },
  rrValue: {
    fontFamily: font.regular,
    fontSize: 17,
    color: color.accent300,
    fontVariant: ['tabular-nums'],
  },
  note: {
    fontFamily: font.regular,
    fontSize: 11.5,
    color: color.muted,
    marginTop: 6,
    lineHeight: 16,
  },
})
