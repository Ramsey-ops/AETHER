import { useEffect, useState } from 'react'
import { getTodayBriefing } from '../../lib/api'
import type { BriefingResponse } from '../../types/briefing'
import { BottomTabBar } from '../../components/BottomTabBar/BottomTabBar'
import { DevBanner } from '../../components/DevBanner/DevBanner'
import { StatusPill } from '../../components/StatusPill/StatusPill'
import { GreetingHeader } from './GreetingHeader'
import { VerdictCard } from './VerdictCard'
import { SessionsStrip } from './SessionsStrip'
import { WatchlistPreview } from './WatchlistPreview'
import { GoalProgressCard } from './GoalProgressCard'
import './BriefingScreen.css'

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: BriefingResponse }

export function BriefingScreen() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  function load() {
    setState({ status: 'loading' })
    getTodayBriefing()
      .then((data) => setState({ status: 'ready', data }))
      .catch(() => setState({ status: 'error' }))
  }

  useEffect(load, [])

  return (
    <div className="briefing-screen">
      <div className="briefing-screen__panel">
        <div className="briefing-screen__content">
          {state.status === 'loading' && (
            <div className="briefing-screen__placeholder">
              <StatusPill status="ANALYZING" label="Analyzing today's market…" />
            </div>
          )}

          {state.status === 'error' && (
            <div className="briefing-screen__placeholder">
              <StatusPill status="DATA_UNAVAILABLE" label="Couldn't load today's briefing" />
              <button type="button" className="briefing-screen__retry" onClick={load}>
                Retry
              </button>
            </div>
          )}

          {state.status === 'ready' && (
            <>
              {state.data.isMockData && <DevBanner />}
              <GreetingHeader name={state.data.greetingName} date={state.data.date} />
              <VerdictCard verdict={state.data.verdict} />
              <SessionsStrip sessions={state.data.sessions} />
              <WatchlistPreview pairs={state.data.watchlistPreview} />
              <GoalProgressCard goal={state.data.goalProgress} />
            </>
          )}
        </div>
        <BottomTabBar active="today" />
      </div>
    </div>
  )
}
