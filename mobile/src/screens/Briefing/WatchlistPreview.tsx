import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { CaretRightIcon } from 'phosphor-react-native'
import type { PairSummary } from '../../types/briefing'
import { StatusPill } from '../../components/StatusPill/StatusPill'
import { color, font, radius } from '../../theme/tokens'
import { formatFxPrice } from '../../lib/format'

interface WatchlistPreviewProps {
  pairs: PairSummary[]
  onSelectPair?: (symbol: string) => void
}

const rowStyleForStatus: Partial<Record<PairSummary['status'], ViewStyle>> = {
  BUY: { borderColor: 'rgba(145, 132, 217, 0.4)', backgroundColor: color.surface },
  NEWS_RISK: { borderColor: 'rgba(214, 138, 138, 0.35)' },
  NO_TRADE: { borderColor: 'rgba(233, 233, 237, 0.1)', backgroundColor: color.sunken, opacity: 0.72 },
  DATA_UNAVAILABLE: { borderColor: 'rgba(233, 233, 237, 0.1)', backgroundColor: color.sunken, opacity: 0.72 },
}

/**
 * Condensed, read-only summary of the user's TradingView-synced watchlist
 * (Part 2.4). The full watchlist — search, reorder, per-pair settings — is
 * Screen 3; this only surfaces enough to answer "what needs my attention."
 *
 * `status`/`subtext`/`confidence` are still Phase 2 preview content (the
 * symbol list itself is a placeholder until TradingView sync exists, and
 * the trading judgment is the Phase 3 AI socket) — but `price`/
 * `changePercent` are real, live quotes once a market data provider is
 * configured on the backend.
 */
export function WatchlistPreview({ pairs, onSelectPair }: WatchlistPreviewProps) {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.label}>YOUR WATCHLIST</Text>
        <Text style={styles.sort}>Sorted by conviction</Text>
      </View>
      <View style={styles.list}>
        {pairs.map((pair) => (
          <Pressable
            key={pair.symbol}
            style={[styles.row, rowStyleForStatus[pair.status]]}
            onPress={() => onSelectPair?.(pair.symbol)}
          >
            <View style={styles.main}>
              <View style={styles.symbolRow}>
                <Text style={styles.symbol}>{pair.symbol}</Text>
                <StatusPill status={pair.status} />
              </View>
              <View style={styles.priceRow}>
                {pair.price != null ? (
                  <>
                    <Text style={styles.price}>{formatFxPrice(pair.symbol, pair.price)}</Text>
                    {pair.changePercent != null && (
                      <Text style={pair.changePercent >= 0 ? styles.changeUp : styles.changeDown}>
                        {pair.changePercent >= 0 ? '+' : ''}
                        {pair.changePercent.toFixed(2)}%
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.priceUnavailable}>Live price unavailable</Text>
                )}
              </View>
              <Text style={styles.subtext}>{pair.subtext}</Text>
            </View>
            {pair.confidence != null && (
              <View style={styles.confidence}>
                <Text style={styles.confidenceValue}>{pair.confidence}</Text>
                <Text style={styles.confidenceLabel}>CONF</Text>
              </View>
            )}
            <CaretRightIcon size={16} color={color.dim} />
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 10,
  },
  label: {
    fontFamily: font.regular,
    fontSize: 11,
    letterSpacing: 1.7,
    color: color.muted,
  },
  sort: {
    fontFamily: font.regular,
    fontSize: 12,
    color: color.accent400,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.12)',
    borderRadius: radius.md,
    backgroundColor: color.raised,
    padding: 14,
  },
  main: {
    flex: 1,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  symbol: {
    fontFamily: font.semibold,
    fontSize: 16,
    color: color.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 3,
  },
  price: {
    fontFamily: font.regular,
    fontSize: 13,
    color: color.text2,
  },
  changeUp: {
    fontFamily: font.regular,
    fontSize: 11.5,
    color: color.up,
  },
  changeDown: {
    fontFamily: font.regular,
    fontSize: 11.5,
    color: color.down,
  },
  priceUnavailable: {
    fontFamily: font.regular,
    fontSize: 11.5,
    fontStyle: 'italic',
    color: color.dim,
  },
  subtext: {
    fontFamily: font.regular,
    fontSize: 12.5,
    color: color.text3,
    marginTop: 5,
  },
  confidence: {
    alignItems: 'flex-end',
  },
  confidenceValue: {
    fontFamily: font.regular,
    fontSize: 15,
    color: color.text,
  },
  confidenceLabel: {
    fontFamily: font.regular,
    fontSize: 10.5,
    color: color.muted,
    letterSpacing: 0.9,
  },
})
