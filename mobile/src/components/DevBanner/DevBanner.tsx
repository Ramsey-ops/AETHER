import { StyleSheet, Text, View } from 'react-native'
import { FlaskIcon } from 'phosphor-react-native'
import { color, radius } from '../../theme/tokens'

interface DevBannerProps {
  /** True once watchlist prices are real quotes rather than all-null. */
  marketDataConnected: boolean
}

/**
 * Per the project brief: "Do not hide mock data behind the appearance of
 * being live data." Renders precisely what's real and what isn't — a
 * blanket "mock data" label would now be wrong once market data is live
 * but the AI verdict, sessions, and goals are still placeholders.
 */
export function DevBanner({ marketDataConnected }: DevBannerProps) {
  const text = marketDataConnected
    ? 'Watchlist prices are live. AI verdict, sessions, and goals are still previews.'
    : "Mock data — market data and AI engines aren't connected yet"

  return (
    <View style={styles.banner}>
      <FlaskIcon size={14} color={color.caution} />
      <Text style={styles.text}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(83, 74, 44, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(201, 185, 138, 0.35)',
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  text: {
    flex: 1,
    fontSize: 12,
    color: color.cautionText,
  },
})
