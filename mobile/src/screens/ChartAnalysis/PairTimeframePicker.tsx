import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { color, font, radius } from '../../theme/tokens'

const PAIRS = ['XAUUSD', 'EURUSD', 'USDJPY', 'GBPUSD']
const TIMEFRAMES = ['1H', '4H', '1D', '1W']

interface PairTimeframePickerProps {
  submitting: boolean
  onConfirm: (pair: string, timeframe: string) => void
}

/**
 * There's no vision model yet to read the pair/timeframe off a screenshot
 * (that's Phase 3D+, gated on the trading strategy) — this is the honest
 * bridge: the trader confirms what the chart shows, which is enough for
 * Aether to run a real live-data cross-check on that pair.
 */
export function PairTimeframePicker({ submitting, onConfirm }: PairTimeframePickerProps) {
  const [pair, setPair] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<string | null>(null)

  return (
    <View style={styles.wrap}>
      <Text style={styles.note}>
        Aether can't read the chart yet — that arrives with the trading strategy. Confirm what it shows so the
        cross-check below can run on real data.
      </Text>

      <Text style={styles.label}>Pair</Text>
      <View style={styles.chipRow}>
        {PAIRS.map((p) => (
          <Pressable key={p} style={[styles.chip, pair === p && styles.chipActive]} onPress={() => setPair(p)}>
            <Text style={[styles.chipText, pair === p && styles.chipTextActive]}>{p}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.label, styles.labelSpaced]}>Timeframe</Text>
      <View style={styles.chipRow}>
        {TIMEFRAMES.map((t) => (
          <Pressable
            key={t}
            style={[styles.chip, timeframe === t && styles.chipActive]}
            onPress={() => setTimeframe(t)}
          >
            <Text style={[styles.chipText, timeframe === t && styles.chipTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.confirmButton, (!pair || !timeframe || submitting) && styles.confirmButtonDisabled]}
        onPress={() => pair && timeframe && onConfirm(pair, timeframe)}
        disabled={!pair || !timeframe || submitting}
      >
        {submitting ? (
          <ActivityIndicator size="small" color={color.canvas} />
        ) : (
          <Text style={styles.confirmButtonText}>Confirm & cross-check live data</Text>
        )}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
  },
  note: {
    fontFamily: font.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: color.text3,
    marginBottom: 16,
  },
  label: {
    fontFamily: font.regular,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: color.muted,
    marginBottom: 8,
  },
  labelSpaced: {
    marginTop: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.18)',
    backgroundColor: color.raised,
  },
  chipActive: {
    borderColor: color.accent,
    backgroundColor: color.accent900,
  },
  chipText: {
    fontFamily: font.medium,
    fontSize: 13,
    color: color.text3,
  },
  chipTextActive: {
    color: color.accent300,
  },
  confirmButton: {
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: color.accent400,
    marginTop: 20,
  },
  confirmButtonDisabled: {
    opacity: 0.45,
  },
  confirmButtonText: {
    fontFamily: font.semibold,
    fontSize: 14,
    color: color.canvas,
  },
})
