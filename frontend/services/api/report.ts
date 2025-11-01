import apiClient from '@/services/api';
import { ApiResponse } from '@/types';

/**
 * 报告相关 API 服务
 */
export const reportApi = {
  /**
   * 生成房间分配报告
   */
  getAllocationReport: (sessionId: number) =>
    apiClient.get<ApiResponse<any>>(`/reports/${sessionId}/allocation`),

  /**
   * 生成禅堂座位报告
   */
  getMeditationSeatReport: (sessionId: number) =>
    apiClient.get<ApiResponse<any>>(`/reports/${sessionId}/meditation-seat`),

  /**
   * 生成学员统计报告
   */
  getStudentStatisticsReport: (sessionId: number) =>
    apiClient.get<ApiResponse<any>>(`/reports/${sessionId}/student-statistics`),

  /**
   * 生成综合报告
   */
  getComprehensiveReport: (sessionId: number) =>
    apiClient.get<ApiResponse<any>>(`/reports/${sessionId}/comprehensive`),

  /**
   * 生成冲突报告
   */
  getConflictReport: (sessionId: number) =>
    apiClient.get<ApiResponse<any>>(`/reports/${sessionId}/conflicts`),
};
