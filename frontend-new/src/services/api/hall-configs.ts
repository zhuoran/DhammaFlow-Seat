import type { ApiResponse, CompiledLayout, HallConfig, HallLayout } from '@/types/domain'
import { apiClient } from '@/lib/http'

export async function fetchHallConfigs(sessionId: number): Promise<HallConfig[]> {
  const response = await apiClient.get<ApiResponse<{ list: HallConfig[] }>>('/hall-configs', {
    params: { sessionId },
  })
  return response.data.data?.list ?? []
}

export async function updateHallLayout(id: number, layout: HallLayout): Promise<HallConfig> {
  const response = await apiClient.put<ApiResponse<HallConfig>>(`/hall-configs/${id}/layout`, {
    layout,
  })
  return response.data.data as HallConfig
}

export async function compileHallLayout(id: number): Promise<CompiledLayout> {
  const response = await apiClient.post<ApiResponse<CompiledLayout>>(`/hall-configs/${id}/compile`)
  return response.data.data as CompiledLayout
}
