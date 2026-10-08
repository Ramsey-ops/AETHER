import { useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { PlusIcon } from 'phosphor-react-native'
import { getJournal } from '../../lib/api'
import type { JournalResponse } from '../../types/journal'
import { BottomTabBar, type TabKey } from '../../components/BottomTabBar/BottomTabBar'
import { StatusPill } from '../../components/StatusPill/StatusPill'
import { color, font, radius } from '../../theme/tokens'
import { TradeCard } from './TradeCard'

interface JournalScreenProps {
  onLogTrade: () => void
  onSelectTab?: (tab: TabKey) => void
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: JournalResponse }

export function JournalScreen({ onLogTrade, onSelectTab }: JournalScreenProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [refreshing, setRefreshing] = useState(false)

  function load(opts: { silent?: boolean } = {}) {
    if (!opts.silent) setState({ status: 'loading' })
    return getJournal()
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

  async function onMutated() {
    await load({ silent: true })
  }

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
            <StatusPill status="ANALYZING" label="Loading journal…" />
          </View>
        )}

        {state.status === 'error' && (
          <View style={styles.placeholder}>
            <StatusPill status="DATA_UNAVAILABLE" label="Couldn't load your journal" />
            <Text style={styles.retryHint}>Pull down to retry</Text>
          </View>
        )}

        {state.status === 'ready' && (
          <>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Journal</Text>
              <Pressable style={styles.logButton} onPress={onLogTrade}>
                <PlusIcon size={14} color={color.accent300} />
                <Text style={styles.logButtonText}>Log</Text>
              </Pressable>
            </View>

            <View style={styles.statsRow}>
              <StatCard label="Win rate" value={formatPercent(state.data.stats.winRatePercent)} />
              <StatCard
                label="Avg R"
                value={state.data.stats.avgR != null ? state.data.stats.avgR.toFixed(1) : '—'}
                valueColor={
                  state.data.stats.avgR != null
                    ? state.data.stats.avgR >= 0
                      ? color.up
                      : color.down
                    : undefined
                }
              />
              <StatCard label="Discipline" value={formatPercent(state.data.stats.disciplinePercent)} />
            </View>

            {state.data.trades.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No trades logged yet</Text>
                <Text style={styles.emptyText}>
                  Tap "Log" to record your first trade — entry, exit, result in R, and what you learned.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionLabel}>RECENT TRADES</Text>
                <View style={styles.list}>
                  {state.data.trades.map((trade) => (
                    <TradeCard key={trade.id} trade={trade} onMutated={onMutated} />
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
      <BottomTabBar active="journal" onSelect={onSelectTab} />
    </View>
  )
}

function formatPercent(value: number | null): string {
  return value != null ? `${Math.round(value)}%` : '—'
}

function StatCard({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
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
  },
  title: {
    fontFamily: font.medium,
    fontSize: 26,
    color: color.text,
    letterSpacing: -0.4,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: color.accent,
    borderRadius: radius.md,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  logButtonText: {
    fontFamily: font.regular,
    fontSize: 13,
    color: color.accent300,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.12)',
    borderRadius: radius.md,
    backgroundColor: color.raised,
    padding: 12,
  },
  statLabel: {
    fontFamily: font.regular,
    fontSize: 11.5,
    color: color.muted,
  },
  statValue: {
    fontFamily: font.regular,
    fontSize: 19,
    color: color.text,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  emptyState: {
    borderWidth: 1,
    borderColor: 'rgba(233, 233, 237, 0.12)',
    borderStyle: 'dashed',
    borderRadius: radius.md,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  emptyTitle: {
    fontFamily: font.medium,
    fontSize: 15,
    color: color.text2,
  },
  emptyText: {
    fontFamily: font.regular,
    fontSize: 12.5,
    color: color.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    letterSpacing: 1.4,
    color: color.muted,
    marginBottom: 10,
  },
  list: {
    gap: 11,
  },
})
