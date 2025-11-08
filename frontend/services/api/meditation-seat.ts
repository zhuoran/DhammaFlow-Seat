import apiClient from '@/services/api';
import { ApiResponse } from '@/types';

/**
 * 禅堂座位相关 API 服务
 */
export const meditationSeatApi = {
  /**
   * 为指定会期生成禅堂座位
   */
  generateSeats: (sessionId: number) =>
    apiClient.post<ApiResponse<any>>(`/meditation-seats/generate?sessionId=${sessionId}`),

  /**
   * 获取指定会期的所有座位
   */
  getSeats: (sessionId: number) =>
    apiClient.get<ApiResponse<{ list: any[] }>>(`/meditation-seats/session/${sessionId}`),

  /**
   * 按区域获取座位
   */
  getSeatsByRegion: (sessionId: number, regionCode: string) =>
    apiClient.get<ApiResponse<{ list: any[] }>>(`/meditation-seats/region?sessionId=${sessionId}&regionCode=${regionCode}`),

  /**
   * 获取单个座位信息
   */
  getSeat: (seatId: number) =>
    apiClient.get<ApiResponse<any>>(`/meditation-seats/${seatId}`),

  /**
   * 交换两个座位的学员
   */
  swapSeats: (seatId1: number, seatId2: number) =>
    apiClient.put<ApiResponse<string>>(`/meditation-seats/${seatId1}/swap/${seatId2}`),

  /**
   * 为学员分配座位
   */
  assignSeat: (seatId: number, studentId: number) =>
    apiClient.put<ApiResponse<string>>(`/meditation-seats/${seatId}/assign?studentId=${studentId}`),

  /**
   * 获取座位占用统计
   */
  getStatistics: (sessionId: number) =>
    apiClient.get<ApiResponse<{
      totalSeats: number;
      occupiedSeats: number;
      availableSeats: number;
      occupancyRate: number;
    }>>(`/meditation-seats/statistics/${sessionId}`),

  /**
   * 删除会期的所有座位（重新生成前）
   */
  deleteSessionSeats: (sessionId: number) =>
    apiClient.delete<ApiResponse<string>>(`/meditation-seats/session/${sessionId}`),
};
