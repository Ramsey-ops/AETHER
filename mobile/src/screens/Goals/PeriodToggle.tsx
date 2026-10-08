import { Pressable, StyleSheet, Text, View } from 'react-native'
import { color, font, radius } from '../../theme/tokens'

export type Period = 'monthly' | 'weekly'

interface PeriodToggleProps {
  selected: Period
  onSelect: (period: Period) => void
}

export function PeriodToggle({ selected, onSelect }: PeriodToggleProps) {
  return (
    <View style={styles.row}>
      {(['monthly', 'weekly'] as const).map((period) => {
        const active = period === selected
        return (
          <Pressable
            key={period}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onSelect(period)}
          >
            <Text style={[styles.text, active && styles.textActive]}>
              {period === 'monthly' ? 'Monthly' : 'Weekly'}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
    padding: 3,
    borderRadius: radius.md,
    backgroundColor: color.sunken,
    borderWidth: 1,
    borderColor: color.divider,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: color.accent900,
    borderWidth: 1,
    borderColor: 'rgba(145, 132, 217, 0.35)',
  },
  text: {
    fontFamily: font.regular,
    fontSize: 13,
    color: color.text3,
  },
  textActive: {
    color: color.accent300,
  },
})
