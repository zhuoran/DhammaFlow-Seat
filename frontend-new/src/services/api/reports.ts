import { apiClient } from '@/lib/http'

export async function downloadSeatReport(sessionId: number): Promise<Blob> {
  const res = await apiClient.get(`/reports/export`, { params: { sessionId }, responseType: 'blob' })
  return res.data
}
