/**
 * Mirrors backend/app/models.py (Goals* family). Currency-only — see the
 * note in types/briefing.ts's GoalProgress. Keep in sync by hand.
 */

export interface WeeklyDayActivity {
  label: string
  date: string
  traded: boolean
}

export interface MonthlyGoalProgress {
  periodLabel: string
  targetCurrency: number
  achievedCurrency: number
  remainingCurrency: number
  percent: number
  daysLeftInMonth: number
  startingBalance: number
  currentBalance: number
}

export interface WeeklyGoalProgress {
  targetCurrency: number
  achievedCurrency: number
  percent: number
  days: WeeklyDayActivity[]
  note: string
}

export interface GoalsResponse {
  monthly: MonthlyGoalProgress
  weekly: WeeklyGoalProgress
  disciplineNote: string
}

export interface GoalSettings {
  startingBalance: number
  currentBalance: number
  monthlyTargetCurrency: number
  weeklyTargetCurrency: number
  weeklyAchievedCurrency: number
}

export type UpdateGoalSettingsRequest = GoalSettings
