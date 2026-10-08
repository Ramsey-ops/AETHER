import Constants from 'expo-constants'
import { File, UploadTask, UploadType } from 'expo-file-system'
import type { BriefingResponse } from '../types/briefing'
import type { PairAnalysisResponse } from '../types/analysis'
import type { MarketsResponse } from '../types/markets'
import type { NewsResponse } from '../types/news'
import type { CreateTradeRequest, JournalResponse, TradeLogEntry } from '../types/journal'
import type { GoalSettings, GoalsResponse, UpdateGoalSettingsRequest } from '../types/goals'
import type { ChartAnalysis, ChartAnalysisListResponse } from '../types/chartAnalysis'

export class ApiError extends Error {}

/**
 * The phone can't reach "localhost" — that resolves to the phone itself.
 * Expo already knows the dev machine's LAN address (it's how Expo Go found
 * this app in the first place), so we reuse that host and just point at
 * the backend's port instead of hardcoding an IP that changes per network.
 */
function resolveApiBaseUrl(): string {
  const hostUri =
    Constants.expoConfig?.hostUri ?? (Constants as any).expoGoConfig?.debuggerHost
  if (hostUri) {
    const host = String(hostUri).split(':')[0]
    return `http://${host}:8000`
  }
  return 'http://localhost:8000'
}

export const API_BASE_URL = resolveApiBaseUrl()

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`)
  if (!res.ok) {
    throw new ApiError(`${path} responded ${res.status}`)
  }
  return (await res.json()) as T
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    throw new ApiError(`${path} responded ${res.status}`)
  }
  return (await res.json()) as T
}

async function putJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new ApiError(`${path} responded ${res.status}`)
  }
  return (await res.json()) as T
}

async function patchJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new ApiError(`${path} responded ${res.status}`)
  }
  return (await res.json()) as T
}

async function deleteRequest(path: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${path}`, { method: 'DELETE' })
  if (!res.ok) {
    throw new ApiError(`${path} responded ${res.status}`)
  }
}

/** screenshotUrl comes back as a server-relative path ("/media/journal/…")
 * — resolve it against the same host the app is already talking to. */
export function resolveMediaUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}

export function getTodayBriefing(): Promise<BriefingResponse> {
  return getJson<BriefingResponse>('/api/briefing/today')
}

export function getPairAnalysis(symbol: string, timeframe: string): Promise<PairAnalysisResponse> {
  return getJson<PairAnalysisResponse>(
    `/api/analysis/${encodeURIComponent(symbol)}?timeframe=${encodeURIComponent(timeframe)}`,
  )
}

export function getMarkets(): Promise<MarketsResponse> {
  return getJson<MarketsResponse>('/api/markets')
}

export function getNews(): Promise<NewsResponse> {
  return getJson<NewsResponse>('/api/news')
}

export function getJournal(): Promise<JournalResponse> {
  return getJson<JournalResponse>('/api/journal')
}

export function createTrade(body: CreateTradeRequest): Promise<TradeLogEntry> {
  return postJson<TradeLogEntry>('/api/journal/trades', body)
}

export function addLesson(tradeId: number, lesson: string): Promise<TradeLogEntry> {
  return postJson<TradeLogEntry>(`/api/journal/trades/${tradeId}/lesson`, { lesson })
}

export function sendForRetraining(tradeId: number): Promise<TradeLogEntry> {
  return postJson<TradeLogEntry>(`/api/journal/trades/${tradeId}/send-for-retraining`)
}

export function deleteTrade(tradeId: number): Promise<void> {
  return deleteRequest(`/api/journal/trades/${tradeId}`)
}

export function getGoals(): Promise<GoalsResponse> {
  return getJson<GoalsResponse>('/api/goals')
}

export function updateGoalSettings(body: UpdateGoalSettingsRequest): Promise<GoalSettings> {
  return putJson<GoalSettings>('/api/goals/settings', body)
}

/**
 * Uses expo-file-system's native UploadTask rather than hand-building a
 * FormData/Blob part — the classic `{uri, name, type}` object trick that
 * used to work stopped being accepted by React Native's networking layer
 * on this RN version ("Unsupported FormDataPart implementation"). Native
 * multipart upload sidesteps that entirely and also handles Android's
 * `content://` picker URIs correctly, which is where the old approach
 * silently produced a filename-less, extension-less part.
 */
export async function uploadScreenshot(
  tradeId: number,
  localUri: string,
  meta?: { mimeType?: string | null },
): Promise<TradeLogEntry> {
  const file = new File(localUri)
  const task = new UploadTask(file, `${API_BASE_URL}/api/journal/trades/${tradeId}/screenshot`, {
    httpMethod: 'POST',
    uploadType: UploadType.MULTIPART,
    fieldName: 'file',
    mimeType: meta?.mimeType || 'image/jpeg',
  })

  const result = await task.uploadAsync()
  if (result.status < 200 || result.status >= 300) {
    throw new ApiError(`screenshot upload responded ${result.status}${result.body ? `: ${result.body}` : ''}`)
  }
  return JSON.parse(result.body) as TradeLogEntry
}

/** Screen 7 — same native UploadTask approach as uploadScreenshot, for the
 * same reason (RN's networking layer rejects hand-built FormData parts on
 * this RN version). */
export async function uploadChartScreenshot(
  localUri: string,
  meta?: { mimeType?: string | null },
): Promise<ChartAnalysis> {
  const file = new File(localUri)
  const task = new UploadTask(file, `${API_BASE_URL}/api/chart-analysis`, {
    httpMethod: 'POST',
    uploadType: UploadType.MULTIPART,
    fieldName: 'file',
    mimeType: meta?.mimeType || 'image/jpeg',
  })

  const result = await task.uploadAsync()
  if (result.status < 200 || result.status >= 300) {
    throw new ApiError(`chart upload responded ${result.status}${result.body ? `: ${result.body}` : ''}`)
  }
  return JSON.parse(result.body) as ChartAnalysis
}

export function confirmChartDetection(analysisId: number, pair: string, timeframe: string): Promise<ChartAnalysis> {
  return patchJson<ChartAnalysis>(`/api/chart-analysis/${analysisId}/detection`, { pair, timeframe })
}

export function getChartAnalysis(analysisId: number): Promise<ChartAnalysis> {
  return getJson<ChartAnalysis>(`/api/chart-analysis/${analysisId}`)
}

export function listChartAnalyses(): Promise<ChartAnalysisListResponse> {
  return getJson<ChartAnalysisListResponse>('/api/chart-analysis')
}
