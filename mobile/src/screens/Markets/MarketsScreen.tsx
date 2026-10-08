import { useEffect, useMemo, useState } from 'react'
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { LinkSimpleIcon, SlidersHorizontalIcon } from 'phosphor-react-native'
import { getMarkets } from '../../lib/api'
import type { MarketsResponse } from '../../types/markets'
import { BottomTabBar, type TabKey } from '../../components/BottomTabBar/BottomTabBar'
import { StatusPill } from '../../components/StatusPill/StatusPill'
import { color, font } from '../../theme/tokens'
import { FilterChips, type MarketFilter } from './FilterChips'
import { MarketPairCard } from './MarketPairCard'

interface MarketsScreenProps {
  onSelectPair: (symbol: string) => void
  onSelectTab?: (tab: TabKey) => void
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: MarketsResponse }

function matchesFilter(status: string, filter: MarketFilter): boolean {
  switch (filter) {
    case 'all':
      return true
    case 'setups':
      return status === 'BUY' || status === 'SELL'
    case 'waiting':
      return status === 'WAIT' || status === 'MONITOR'
    case 'newsRisk':
      return status === 'NEWS_RISK'
  }
}

export function MarketsScreen({ onSelectPair, onSelectTab }: MarketsScreenProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<MarketFilter>('all')

  function load(opts: { silent?: boolean } = {}) {
    if (!opts.silent) setState({ status: 'loading' })
    return getMarkets()
      .then((data) => setState({ status: 'ready', data }))
      .catch(() => setState({ status: 'error' }))
  }

  useEffect(() => {
    load()
  }, [])

  async function onRefresh() {
    setRefreshing(true)
    await load({ silent: true })
    setRefreshing(false)
  }

  const visiblePairs = useMemo(() => {
    if (state.status !== 'ready') return []
    return state.data.pairs.filter((p) => matchesFilter(p.status, filter))
  }, [state, filter])

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.accent400} />
        }
      >
        {state.status === 'loading' && (
          <View style={styles.placeholder}>
            <StatusPill status="ANALYZING" label="Loading markets…" />
          </View>
        )}

        {state.status === 'error' && (
          <View style={styles.placeholder}>
            <StatusPill status="DATA_UNAVAILABLE" label="Couldn't load markets" />
            <Text style={styles.retryHint}>Pull down to retry</Text>
          </View>
        )}

        {state.status === 'ready' && (
          <>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Markets</Text>
              <Pressable
                hitSlop={10}
                onPress={() => Alert.alert('Coming soon', 'Watchlist customization arrives in a later module.')}
              >
                <SlidersHorizontalIcon size={20} color={color.text2} />
              </Pressable>
            </View>
            <View style={styles.syncRow}>
              <LinkSimpleIcon size={14} color={color.accent400} />
              <Text style={styles.syncText}>{state.data.syncNote}</Text>
            </View>

            <FilterChips selected={filter} onSelect={setFilter} countAll={state.data.pairs.length} />

            <View style={styles.list}>
              {visiblePairs.map((pair) => (
                <MarketPairCard key={pair.symbol} pair={pair} onPress={() => onSelectPair(pair.symbol)} />
              ))}
              {visiblePairs.length === 0 && (
                <Text style={styles.emptyText}>No pairs match this filter right now.</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
      <BottomTabBar active="markets" onSelect={onSelectTab} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.canvas,
  },
  content: {
    padding: 18,
    paddingTop: 24,
    paddingBottom: 100,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 500,
  },
  retryHint: {
    fontSize: 12,
    color: color.dim,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontFamily: font.medium,
    fontSize: 26,
    color: color.text,
    letterSpacing: -0.4,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 16,
  },
  syncText: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 12,
    color: color.muted,
  },
  list: {
    gap: 11,
  },
  emptyText: {
    fontFamily: font.regular,
    fontSize: 13,
    color: color.dim,
    textAlign: 'center',
    marginTop: 30,
  },
})
