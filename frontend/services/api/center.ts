import apiClient from '@/services/api';
import { Center, ApiResponse } from '@/types';

/**
 * 禅修中心相关 API 服务
 */
export const centerApi = {
  /**
   * 获取所有中心
   */
  getCenters: () =>
    apiClient.get<ApiResponse<{ list: Center[] }>>('/centers'),

  /**
   * 获取单个中心
   */
  getCenter: (id: number) =>
    apiClient.get<ApiResponse<Center>>(`/centers/${id}`),

  /**
   * 创建中心
   */
  createCenter: (center: Omit<Center, 'id'>) =>
    apiClient.post<ApiResponse<Center>>('/centers', center),

  /**
   * 更新中心
   */
  updateCenter: (id: number, center: Partial<Center>) =>
    apiClient.put<ApiResponse<Center>>(`/centers/${id}`, center),

  /**
   * 删除中心
   */
  deleteCenter: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/centers/${id}`),
};
