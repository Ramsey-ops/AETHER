import { StyleSheet, Text, View } from 'react-native'
import { WarningIcon } from 'phosphor-react-native'
import type { NextHighImpact } from '../../types/news'
import { color, font, radius } from '../../theme/tokens'
import { formatUtcHHMMAsLocal } from '../../lib/time'

interface NextHighImpactBannerProps {
  data: NextHighImpact
}

export function NextHighImpactBanner({ data }: NextHighImpactBannerProps) {
  const { event } = data

  return (
    <View style={styles.card}>
      <View style={styles.kicker}>
        <WarningIcon size={15} color={color.down} />
        <Text style={styles.kickerText}>NEXT HIGH IMPACT · IN {data.inLabel.toUpperCase()}</Text>
      </View>
      <Text style={styles.title}>
        {event.title} — {formatUtcHHMMAsLocal(event.timeUTC)}
      </Text>
      <Text style={styles.note}>
        {event.forecast && `Forecast ${event.forecast}`}
        {event.forecast && event.previous && ' · '}
        {event.previous && `Previous ${event.previous}. `}
        {event.note}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: 'rgba(214, 138, 138, 0.4)',
    backgroundColor: 'rgba(74, 42, 42, 0.32)',
    borderRadius: radius.md,
    padding: 15,
  },
  kicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kickerText: {
    fontFamily: font.regular,
    fontSize: 11,
    letterSpacing: 1.4,
    color: color.down,
  },
  title: {
    fontFamily: font.medium,
    fontSize: 19,
    color: color.text,
    marginTop: 9,
    marginBottom: 5,
  },
  note: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 20,
    color: color.text2,
  },
})
