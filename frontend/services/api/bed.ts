import apiClient from '@/services/api';
import { ApiResponse } from '@/types';

/**
 * 床位相关 API 服务
 */
export const bedApi = {
  /**
   * 获取床位列表
   */
  getBeds: (roomId?: number) =>
    apiClient.get<ApiResponse<{ list: any[] }>>('/beds', {
      params: {
        ...(roomId && { roomId }),
      },
    }),

  /**
   * 根据ID获取床位详情
   */
  getBed: (id: number) =>
    apiClient.get<ApiResponse<any>>(`/beds/${id}`),

  /**
   * 创建床位
   */
  createBed: (bed: any) =>
    apiClient.post<ApiResponse<number>>('/beds', bed),

  /**
   * 批量创建床位
   */
  createBedsBatch: (beds: any[]) =>
    apiClient.post<ApiResponse<void>>('/beds/batch', beds),

  /**
   * 更新床位
   */
  updateBed: (id: number, bed: any) =>
    apiClient.put<ApiResponse<void>>(`/beds/${id}`, bed),

  /**
   * 删除床位
   */
  deleteBed: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/beds/${id}`),

  /**
   * 删除房间的所有床位
   */
  deleteBedsOfRoom: (roomId: number) =>
    apiClient.delete<ApiResponse<void>>(`/beds/room/${roomId}`),

  /**
   * 统计床位总数
   */
  countBeds: () =>
    apiClient.get<ApiResponse<number>>('/beds/count'),

  /**
   * 统计房间的床位总数
   */
  countBedsByRoom: (roomId: number) =>
    apiClient.get<ApiResponse<number>>(`/beds/room/${roomId}/count`),
};
