import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import type { MarketPair } from '../../types/markets'
import { StatusPill } from '../../components/StatusPill/StatusPill'
import { Sparkline } from '../../components/Sparkline/Sparkline'
import { color, font, radius } from '../../theme/tokens'
import { formatFxPrice } from '../../lib/format'

interface MarketPairCardProps {
  pair: MarketPair
  onPress?: () => void
}

const cardStyleForStatus: Partial<Record<MarketPair['status'], ViewStyle>> = {
  BUY: { borderColor: 'rgba(145, 132, 217, 0.4)', backgroundColor: color.surface },
  NEWS_RISK: { borderColor: 'rgba(214, 138, 138, 0.35)' },
  NO_TRADE: { borderColor: 'rgba(233, 233, 237, 0.1)', backgroundColor: color.sunken, opacity: 0.75 },
  DATA_UNAVAILABLE: { borderColor: 'rgba(233, 233, 237, 0.1)', backgroundColor: color.sunken, opacity: 0.75 },
}

export function MarketPairCard({ pair, onPress }: MarketPairCardProps) {
  const up = (pair.changePercent ?? 0) >= 0

  return (
    <Pressable style={[styles.card, cardStyleForStatus[pair.status]]} onPress={onPress}>
      <View style={styles.header}>
        <View>
          <Text style={styles.symbol}>{pair.symbol}</Text>
          <Text style={styles.displayName}>{pair.displayName}</Text>
        </View>
        <View style={styles.priceCol}>
          {pair.price != null ? (
            <>
              <Text style={styles.price}>{formatFxPrice(pair.symbol, pair.price)}</Text>
              {pair.changePercent != null && (
                <Text style={[styles.change, { color: up ? color.up : color.down }]}>
                  {up ? '+' : ''}
                  {pair.changePercent.toFixed(2)}%
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.priceUnavailable}>Unavailable</Text>
          )}
        </View>
      </View>

      {pair.candles.length >= 2 && <Sparkline candles={pair.candles} up={up} />}

      <View style={styles.footer}>
        <StatusPill status={pair.status} label={pair.confidence != null ? `${pair.status} · ${pair.confidence}` : undefined} />
        <Text style={styles.subtext} numberOfLines={1}>
          {pair.subtext}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.12)',
    borderRadius: radius.md,
    backgroundColor: color.raised,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  symbol: {
    fontFamily: font.semibold,
    fontSize: 17,
    color: color.text,
  },
  displayName: {
    fontFamily: font.regular,
    fontSize: 12,
    color: color.muted,
    marginTop: 3,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  price: {
    fontFamily: font.regular,
    fontSize: 17,
    color: color.text,
    fontVariant: ['tabular-nums'],
  },
  change: {
    fontFamily: font.regular,
    fontSize: 12,
    marginTop: 3,
  },
  priceUnavailable: {
    fontFamily: font.regular,
    fontSize: 13,
    fontStyle: 'italic',
    color: color.dim,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  subtext: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 12,
    color: color.text3,
  },
})
