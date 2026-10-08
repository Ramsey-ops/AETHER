import { useEffect, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { getTodayBriefing } from '../../lib/api'
import type { BriefingResponse } from '../../types/briefing'
import { BottomTabBar, type TabKey } from '../../components/BottomTabBar/BottomTabBar'
import { DevBanner } from '../../components/DevBanner/DevBanner'
import { StatusPill } from '../../components/StatusPill/StatusPill'
import { color } from '../../theme/tokens'
import { GreetingHeader } from './GreetingHeader'
import { VerdictCard } from './VerdictCard'
import { SessionsStrip } from './SessionsStrip'
import { WatchlistPreview } from './WatchlistPreview'
import { GoalProgressCard } from './GoalProgressCard'

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: BriefingResponse }

interface BriefingScreenProps {
  onSelectPair?: (symbol: string) => void
  onSelectTab?: (tab: TabKey) => void
}

export function BriefingScreen({ onSelectPair, onSelectTab }: BriefingScreenProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [refreshing, setRefreshing] = useState(false)

  function load(opts: { silent?: boolean } = {}) {
    if (!opts.silent) setState({ status: 'loading' })
    return getTodayBriefing()
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
            <StatusPill status="ANALYZING" label="Analyzing today's market…" />
          </View>
        )}

        {state.status === 'error' && (
          <View style={styles.placeholder}>
            <StatusPill status="DATA_UNAVAILABLE" label="Couldn't load today's briefing" />
            <Text style={styles.retryHint}>Pull down to retry</Text>
          </View>
        )}

        {state.status === 'ready' && (
          <>
            {state.data.isMockData && (
              <DevBanner marketDataConnected={state.data.marketDataConnected} />
            )}
            <GreetingHeader
              name={state.data.greetingName}
              currentSessionLabel={state.data.currentSessionLabel}
            />
            <VerdictCard verdict={state.data.verdict} />
            <SessionsStrip sessions={state.data.sessions} />
            <WatchlistPreview pairs={state.data.watchlistPreview} onSelectPair={onSelectPair} />
            <GoalProgressCard goal={state.data.goalProgress} />
          </>
        )}
      </ScrollView>
      <BottomTabBar active="today" onSelect={onSelectTab} />
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
})
