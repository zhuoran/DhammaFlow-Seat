import type { ApiResponse, ListResult, MeditationSeat, SeatStatistics } from '@/types/domain'
import { apiClient } from '@/lib/http'

/**
 * 获取会期的所有座位
 */
export async function fetchSeats(sessionId: number): Promise<MeditationSeat[]> {
  const response = await apiClient.get<ApiResponse<ListResult<MeditationSeat>>>(
    `/meditation-seats/session/${sessionId}`
  )
  return response.data.data?.list ?? []
}

/**
 * 按区域获取座位
 */
export async function fetchSeatsByRegion(
  sessionId: number,
  regionCode: string
): Promise<MeditationSeat[]> {
  const response = await apiClient.get<ApiResponse<ListResult<MeditationSeat>>>(
    '/meditation-seats/region',
    {
      params: { sessionId, regionCode },
    }
  )
  return response.data.data?.list ?? []
}

/**
 * 生成座位
 */
export async function generateSeats(sessionId: number): Promise<MeditationSeat[]> {
  const response = await apiClient.post<ApiResponse<ListResult<MeditationSeat>>>(
    '/meditation-seats/generate',
    null,
    {
      params: { sessionId },
    }
  )
  return response.data.data?.list ?? []
}

/**
 * 为学员分配座位（studentId 为空或 0 表示取消分配）
 */
export async function assignSeat(seatId: number, studentId: number | null): Promise<void> {
  const payloadStudentId = studentId ?? 0
  await apiClient.put(`/meditation-seats/${seatId}/assign`, null, {
    params: { studentId: payloadStudentId },
  })
}

/**
 * 交换两个座位的学员
 */
export async function swapSeats(seatId1: number, seatId2: number): Promise<void> {
  await apiClient.put(`/meditation-seats/${seatId1}/swap/${seatId2}`)
}

/**
 * 获取座位统计信息
 */
export async function fetchSeatStatistics(sessionId: number): Promise<SeatStatistics> {
  const response = await apiClient.get<ApiResponse<SeatStatistics>>(
    `/meditation-seats/statistics/${sessionId}`
  )
  return (
    response.data.data ?? {
      totalSeats: 0,
      occupiedSeats: 0,
      availableSeats: 0,
      maleSeats: 0,
      femaleSeats: 0,
      oldStudents: 0,
      newStudents: 0,
    }
  )
}

/**
 * 获取单个座位信息
 */
export async function fetchSeat(seatId: number): Promise<MeditationSeat | null> {
  const response = await apiClient.get<ApiResponse<MeditationSeat>>(`/meditation-seats/${seatId}`)
  return response.data.data ?? null
}

/**
 * 删除会期的所有座位
 */
export async function deleteSessionSeats(sessionId: number): Promise<void> {
  await apiClient.delete(`/meditation-seats/session/${sessionId}`)
}
