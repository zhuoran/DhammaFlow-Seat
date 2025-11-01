import apiClient from '@/services/api';
import { Allocation, ApiResponse } from '@/types';

/**
 * 房间分配相关 API 服务
 */
export const allocationApi = {
  /**
   * 执行自动分配
   */
  autoAllocate: (sessionId: number) =>
    apiClient.post<ApiResponse<any>>(`/allocations/auto/${sessionId}`),

  /**
   * 获取分配结果列表
   */
  getAllocations: (sessionId: number) =>
    apiClient.get<ApiResponse<{ list: Allocation[] }>>(`/allocations/${sessionId}`),

  /**
   * 获取会期的所有分配记录
   */
  getAllocationsBySession: (sessionId: number) =>
    apiClient.get<ApiResponse<{ list: Allocation[] }>>(`/allocations/${sessionId}`),

  /**
   * 创建分配记录（手动分配）
   */
  createAllocation: (allocation: any) =>
    apiClient.post<ApiResponse<number>>('/allocations', allocation),

  /**
   * 更新分配记录
   */
  updateAllocation: (id: number, allocation: any) =>
    apiClient.put<ApiResponse<void>>(`/allocations/${id}`, allocation),

  /**
   * 删除分配记录
   */
  deleteAllocation: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/allocations/${id}`),

  /**
   * 检测分配冲突
   */
  getConflicts: (sessionId: number) =>
    apiClient.get<ApiResponse<any[]>>(`/allocations/${sessionId}/conflicts`),

  /**
   * 确认分配
   */
  confirmAllocations: (sessionId: number) =>
    apiClient.post<ApiResponse<void>>(`/allocations/${sessionId}/confirm`),

  /**
   * 清除分配
   */
  clearAllocations: (sessionId: number) =>
    apiClient.delete<ApiResponse<void>>(`/allocations/${sessionId}`),

  /**
   * 回滚分配
   */
  rollbackAllocations: (sessionId: number) =>
    apiClient.post<ApiResponse<void>>(`/allocations/${sessionId}/rollback`),
};
