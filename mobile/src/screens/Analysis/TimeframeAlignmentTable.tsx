import { StyleSheet, Text, View } from 'react-native'
import type { TimeframeAlignmentRow, TimeframeBias } from '../../types/analysis'
import { color, font, radius } from '../../theme/tokens'

interface TimeframeAlignmentTableProps {
  rows: TimeframeAlignmentRow[]
}

const BIAS_COLOR: Record<TimeframeBias, string> = {
  Bullish: color.up,
  Bearish: color.down,
  Neutral: color.text3,
  Setup: color.up,
  Confirmed: color.up,
  Pending: color.caution,
}

export function TimeframeAlignmentTable({ rows }: TimeframeAlignmentTableProps) {
  if (rows.length === 0) return null

  return (
    <View>
      <Text style={styles.sectionLabel}>TIMEFRAME ALIGNMENT</Text>
      <View style={styles.table}>
        {rows.map((row) => (
          <View key={row.timeframe} style={styles.row}>
            <Text style={styles.timeframe}>{row.timeframe}</Text>
            <Text style={styles.note} numberOfLines={1}>
              {row.note}
            </Text>
            <Text style={[styles.bias, { color: BIAS_COLOR[row.bias] }]}>{row.bias}</Text>
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
  table: {
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.12)',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 13,
    backgroundColor: color.raised,
  },
  timeframe: {
    width: 34,
    fontFamily: font.regular,
    fontSize: 13,
    color: color.text2,
  },
  note: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 12.5,
    color: color.text3,
  },
  bias: {
    fontFamily: font.regular,
    fontSize: 12,
  },
})
