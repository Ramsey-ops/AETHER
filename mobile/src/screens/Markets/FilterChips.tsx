import { Pressable, StyleSheet, Text, View } from 'react-native'
import { color, font } from '../../theme/tokens'

export type MarketFilter = 'all' | 'setups' | 'waiting' | 'newsRisk'

interface FilterChipsProps {
  selected: MarketFilter
  onSelect: (filter: MarketFilter) => void
  countAll: number
}

const FILTERS: { key: MarketFilter; label: (countAll: number) => string }[] = [
  { key: 'all', label: (n) => `All ${n}` },
  { key: 'setups', label: () => 'Setups' },
  { key: 'waiting', label: () => 'Waiting' },
  { key: 'newsRisk', label: () => 'News risk' },
]

export function FilterChips({ selected, onSelect, countAll }: FilterChipsProps) {
  return (
    <View style={styles.row}>
      {FILTERS.map((f) => {
        const active = f.key === selected
        return (
          <Pressable key={f.key} style={[styles.chip, active && styles.chipActive]} onPress={() => onSelect(f.key)}>
            <Text style={[styles.text, active && styles.textActive]}>{f.label(countAll)}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.14)',
  },
  chipActive: {
    backgroundColor: color.accent900,
    borderColor: 'rgba(145, 132, 217, 0.4)',
  },
  text: {
    fontFamily: font.regular,
    fontSize: 12,
    color: color.text3,
  },
  textActive: {
    color: color.accent300,
  },
})
