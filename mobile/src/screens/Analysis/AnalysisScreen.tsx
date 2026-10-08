import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { getPairAnalysis } from '../../lib/api'
import { formatFxPrice } from '../../lib/format'
import type { PairAnalysisResponse } from '../../types/analysis'
import { BottomTabBar, type TabKey } from '../../components/BottomTabBar/BottomTabBar'
import { StatusPill } from '../../components/StatusPill/StatusPill'
import { color, font } from '../../theme/tokens'
import { AnalysisHeader } from './AnalysisHeader'
import { TimeframeTabs } from './TimeframeTabs'
import { Sparkline } from '../../components/Sparkline/Sparkline'
import { RecommendationCard } from './RecommendationCard'
import { TimeframeAlignmentTable } from './TimeframeAlignmentTable'
import { LevelsCard } from './LevelsCard'
import { ReasoningList } from './ReasoningList'
import { RiskWarningBanner } from './RiskWarningBanner'
import { ActionButtons } from './ActionButtons'

interface AnalysisScreenProps {
  symbol: string
  onBack: () => void
  onSelectTab?: (tab: TabKey) => void
  onLogToJournal: (symbol: string) => void
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: PairAnalysisResponse }

export function AnalysisScreen({ symbol, onBack, onSelectTab, onLogToJournal }: AnalysisScreenProps) {
  const [timeframe, setTimeframe] = useState('4H')
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    setState({ status: 'loading' })
    getPairAnalysis(symbol, timeframe)
      .then((data) => setState({ status: 'ready', data }))
      .catch(() => setState({ status: 'error' }))
  }, [symbol, timeframe])

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {state.status === 'loading' && (
          <View style={styles.placeholder}>
            <StatusPill status="ANALYZING" label="Loading analysis…" />
          </View>
        )}

        {state.status === 'error' && (
          <View style={styles.placeholder}>
            <StatusPill status="DATA_UNAVAILABLE" label="Couldn't load this pair's analysis" />
          </View>
        )}

        {state.status === 'ready' && (
          <ReadyAnalysis
            data={state.data}
            timeframe={timeframe}
            onSelectTimeframe={setTimeframe}
            onBack={onBack}
            onLogToJournal={onLogToJournal}
          />
        )}
      </ScrollView>
      <BottomTabBar active="markets" onSelect={onSelectTab} />
    </View>
  )
}

function ReadyAnalysis({
  data,
  timeframe,
  onSelectTimeframe,
  onBack,
  onLogToJournal,
}: {
  data: PairAnalysisResponse
  timeframe: string
  onSelectTimeframe: (tf: string) => void
  onBack: () => void
  onLogToJournal: (symbol: string) => void
}) {
  const up = (data.changePercent ?? 0) >= 0

  return (
    <>
      <AnalysisHeader
        symbol={data.symbol}
        displayName={data.displayName}
        updatedAtUTC={data.updatedAtUTC}
        onBack={onBack}
      />

      <View style={styles.priceRow}>
        {data.price != null ? (
          <>
            <Text style={styles.price}>{formatFxPrice(data.symbol, data.price)}</Text>
            {data.changePercent != null && (
              <Text style={[styles.change, { color: up ? color.up : color.down }]}>
                {up ? '+' : ''}
                {data.changePercent.toFixed(2)}% today
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.priceUnavailable}>Live price unavailable</Text>
        )}
      </View>

      {data.candles.length >= 2 ? (
        <Sparkline candles={data.candles} up={up} />
      ) : (
        <View style={styles.chartPlaceholder}>
          <Text style={styles.priceUnavailable}>Chart unavailable</Text>
        </View>
      )}

      <TimeframeTabs timeframes={data.availableTimeframes} selected={timeframe} onSelect={onSelectTimeframe} />

      {!data.aiModelConnected && (
        <View style={styles.aiPendingBadge}>
          <Text style={styles.aiPendingText}>PREVIEW — AI MODEL NOT YET CONNECTED</Text>
        </View>
      )}
      <View style={styles.recommendationSpacer}>
        <RecommendationCard
          recommendation={data.recommendation}
          confidence={data.confidence}
          note={data.recommendationNote}
        />
      </View>

      <TimeframeAlignmentTable rows={data.timeframeAlignment} />
      {data.levels && <LevelsCard levels={data.levels} symbol={data.symbol} />}
      <ReasoningList points={data.reasoning} />
      {data.riskWarning && <RiskWarningBanner text={data.riskWarning} />}
      <ActionButtons onLogToJournal={() => onLogToJournal(data.symbol)} />
    </>
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
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  price: {
    fontFamily: font.medium,
    fontSize: 30,
    color: color.text,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  change: {
    fontFamily: font.regular,
    fontSize: 13,
    paddingBottom: 5,
  },
  priceUnavailable: {
    fontFamily: font.regular,
    fontSize: 13,
    fontStyle: 'italic',
    color: color.dim,
  },
  chartPlaceholder: {
    height: 40,
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiPendingBadge: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(233, 233, 237, 0.22)',
  },
  aiPendingText: {
    fontFamily: font.regular,
    fontSize: 9.5,
    letterSpacing: 0.6,
    color: color.dim,
  },
  recommendationSpacer: {
    marginBottom: 4,
  },
})
