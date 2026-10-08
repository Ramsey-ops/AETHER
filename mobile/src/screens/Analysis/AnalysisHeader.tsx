import { Pressable, StyleSheet, Text, View } from 'react-native'
import { BellSimpleIcon, CaretLeftIcon } from 'phosphor-react-native'
import { color, font } from '../../theme/tokens'
import { formatIsoAsLocalTime } from '../../lib/time'

interface AnalysisHeaderProps {
  symbol: string
  displayName: string
  updatedAtUTC: string
  onBack: () => void
}

export function AnalysisHeader({ symbol, displayName, updatedAtUTC, onBack }: AnalysisHeaderProps) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
        <CaretLeftIcon size={20} color={color.text2} />
      </Pressable>
      <View style={styles.titleCol}>
        <Text style={styles.symbol}>{symbol}</Text>
        <Text style={styles.subtitle}>
          {displayName} · updated {formatIsoAsLocalTime(updatedAtUTC)}
        </Text>
      </View>
      <BellSimpleIcon size={19} color={color.text2} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  titleCol: {
    flex: 1,
  },
  symbol: {
    fontFamily: font.semibold,
    fontSize: 19,
    color: color.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: font.regular,
    fontSize: 12,
    color: color.muted,
    marginTop: 2,
  },
})
