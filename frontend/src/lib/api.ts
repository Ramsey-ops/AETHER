import type { BriefingResponse } from '../types/briefing'

export class ApiError extends Error {}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) {
    throw new ApiError(`${path} responded ${res.status}`)
  }
  return (await res.json()) as T
}

export function getTodayBriefing(): Promise<BriefingResponse> {
  return getJson<BriefingResponse>('/api/briefing/today')
}
