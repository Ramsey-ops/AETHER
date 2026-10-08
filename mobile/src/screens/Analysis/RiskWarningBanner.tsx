import { StyleSheet, Text, View } from 'react-native'
import { ShieldWarningIcon } from 'phosphor-react-native'
import { color, font, radius } from '../../theme/tokens'

interface RiskWarningBannerProps {
  text: string
}

export function RiskWarningBanner({ text }: RiskWarningBannerProps) {
  return (
    <View style={styles.banner}>
      <ShieldWarningIcon size={18} color={color.caution} />
      <Text style={styles.text}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: 11,
    borderWidth: 1,
    borderColor: 'rgba(201, 185, 138, 0.35)',
    backgroundColor: 'rgba(83, 74, 44, 0.28)',
    borderRadius: radius.md,
    padding: 13,
    marginTop: 16,
  },
  text: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 12.5,
    lineHeight: 19,
    color: color.cautionText,
  },
})
