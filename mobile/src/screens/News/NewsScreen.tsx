import { useEffect, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { getNews } from '../../lib/api'
import type { NewsResponse } from '../../types/news'
import { BottomTabBar, type TabKey } from '../../components/BottomTabBar/BottomTabBar'
import { StatusPill } from '../../components/StatusPill/StatusPill'
import { color, font } from '../../theme/tokens'
import { NextHighImpactBanner } from './NextHighImpactBanner'
import { CalendarList } from './CalendarList'
import { SentimentRow } from './SentimentRow'
import { HeadlinesList } from './HeadlinesList'

interface NewsScreenProps {
  onSelectTab?: (tab: TabKey) => void
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: NewsResponse }

export function NewsScreen({ onSelectTab }: NewsScreenProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [refreshing, setRefreshing] = useState(false)

  function load(opts: { silent?: boolean } = {}) {
    if (!opts.silent) setState({ status: 'loading' })
    return getNews()
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
            <StatusPill status="ANALYZING" label="Loading news…" />
          </View>
        )}

        {state.status === 'error' && (
          <View style={styles.placeholder}>
            <StatusPill status="DATA_UNAVAILABLE" label="Couldn't load news" />
            <Text style={styles.retryHint}>Pull down to retry</Text>
          </View>
        )}

        {state.status === 'ready' && (
          <>
            <Text style={styles.title}>News</Text>
            <Text style={styles.subtitle}>Only events touching your four pairs.</Text>

            {!state.data.economicCalendarConnected && (
              <View style={styles.previewBadge}>
                <Text style={styles.previewBadgeText}>PREVIEW — ECONOMIC CALENDAR NOT YET CONNECTED</Text>
              </View>
            )}

            {state.data.nextHighImpact && (
              <View style={styles.section}>
                <NextHighImpactBanner data={state.data.nextHighImpact} />
              </View>
            )}

            <CalendarList events={state.data.calendar} />
            <SentimentRow sentiment={state.data.sentiment} />

            {!state.data.newsConnected && (
              <View style={[styles.previewBadge, styles.headlinesPreviewBadge]}>
                <Text style={styles.previewBadgeText}>PREVIEW HEADLINES — LIVE NEWS NOT CONFIGURED</Text>
              </View>
            )}
            {state.data.newsConnected && (
              <Text style={styles.liveSourcesLabel}>
                LIVE: {state.data.newsSourcesConnected.join(' · ')}
                {state.data.aiInterpretationConnected ? ' · AI READ ON' : ''}
              </Text>
            )}
            <HeadlinesList headlines={state.data.headlines} />
          </>
        )}
      </ScrollView>
      <BottomTabBar active="news" onSelect={onSelectTab} />
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
  title: {
    fontFamily: font.medium,
    fontSize: 26,
    color: color.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: font.regular,
    fontSize: 12.5,
    color: color.muted,
    marginTop: 4,
  },
  previewBadge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(233, 233, 237, 0.22)',
  },
  headlinesPreviewBadge: {
    marginTop: 22,
    marginBottom: -4,
  },
  liveSourcesLabel: {
    fontFamily: font.regular,
    fontSize: 9.5,
    letterSpacing: 0.5,
    color: color.dim,
    marginTop: 22,
    marginBottom: -4,
  },
  previewBadgeText: {
    fontFamily: font.regular,
    fontSize: 9.5,
    letterSpacing: 0.6,
    color: color.dim,
  },
  section: {
    marginTop: 16,
  },
})
