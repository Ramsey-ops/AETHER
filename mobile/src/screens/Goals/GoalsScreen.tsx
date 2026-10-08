import { useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { PencilSimpleIcon } from 'phosphor-react-native'
import { getGoals } from '../../lib/api'
import type { GoalsResponse } from '../../types/goals'
import { BottomTabBar, type TabKey } from '../../components/BottomTabBar/BottomTabBar'
import { StatusPill } from '../../components/StatusPill/StatusPill'
import { color, font } from '../../theme/tokens'
import { PeriodToggle, type Period } from './PeriodToggle'
import { MonthlyGoalCard } from './MonthlyGoalCard'
import { WeeklyGoalCard } from './WeeklyGoalCard'
import { DisciplineBanner } from './DisciplineBanner'
import { EditGoalsModal } from './EditGoalsModal'

interface GoalsScreenProps {
  onSelectTab?: (tab: TabKey) => void
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: GoalsResponse }

export function GoalsScreen({ onSelectTab }: GoalsScreenProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [refreshing, setRefreshing] = useState(false)
  const [period, setPeriod] = useState<Period>('monthly')
  const [editOpen, setEditOpen] = useState(false)

  function load(opts: { silent?: boolean } = {}) {
    if (!opts.silent) setState({ status: 'loading' })
    return getGoals()
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
            <StatusPill status="ANALYZING" label="Loading goals…" />
          </View>
        )}

        {state.status === 'error' && (
          <View style={styles.placeholder}>
            <StatusPill status="DATA_UNAVAILABLE" label="Couldn't load goals" />
            <Text style={styles.retryHint}>Pull down to retry</Text>
          </View>
        )}

        {state.status === 'ready' && (
          <>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Goals</Text>
              <Pressable style={styles.editButton} onPress={() => setEditOpen(true)}>
                <PencilSimpleIcon size={14} color={color.accent300} />
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
            </View>
            <Text style={styles.subtitle}>
              An account target in currency. Position sizing stays with you.
            </Text>

            <PeriodToggle selected={period} onSelect={setPeriod} />

            {period === 'monthly' ? (
              <MonthlyGoalCard monthly={state.data.monthly} />
            ) : (
              <WeeklyGoalCard weekly={state.data.weekly} />
            )}

            <DisciplineBanner text={state.data.disciplineNote} />

            <EditGoalsModal
              visible={editOpen}
              settings={{
                startingBalance: state.data.monthly.startingBalance,
                currentBalance: state.data.monthly.currentBalance,
                monthlyTargetCurrency: state.data.monthly.targetCurrency,
                weeklyTargetCurrency: state.data.weekly.targetCurrency,
                weeklyAchievedCurrency: state.data.weekly.achievedCurrency,
              }}
              onClose={() => setEditOpen(false)}
              onSaved={() => {
                setEditOpen(false)
                load({ silent: true })
              }}
            />
          </>
        )}
      </ScrollView>
      <BottomTabBar active="goals" onSelect={onSelectTab} />
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.accent,
  },
  editButtonText: {
    fontFamily: font.regular,
    fontSize: 13,
    color: color.accent300,
  },
  subtitle: {
    fontFamily: font.regular,
    fontSize: 12.5,
    color: color.muted,
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },
})
