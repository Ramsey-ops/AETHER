import { Pressable, StyleSheet, Text, View } from 'react-native'
import { color, font, radius } from '../../theme/tokens'

interface TimeframeTabsProps {
  timeframes: string[]
  selected: string
  onSelect: (timeframe: string) => void
}

export function TimeframeTabs({ timeframes, selected, onSelect }: TimeframeTabsProps) {
  return (
    <View style={styles.row}>
      {timeframes.map((tf) => {
        const active = tf === selected
        return (
          <Pressable key={tf} style={[styles.tab, active && styles.tabActive]} onPress={() => onSelect(tf)}>
            <Text style={[styles.text, active && styles.textActive]}>{tf}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
  },
  tab: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: color.accent900,
    borderWidth: 1,
    borderColor: 'rgba(145, 132, 217, 0.4)',
  },
  text: {
    fontFamily: font.regular,
    fontSize: 11.5,
    color: color.muted,
  },
  textActive: {
    color: color.accent300,
  },
})
