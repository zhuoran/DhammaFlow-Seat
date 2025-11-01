import apiClient from '@/services/api';
import { ApiResponse } from '@/types';

/**
 * 房间相关 API 服务
 */
export const roomApi = {
  /**
   * 获取房间列表
   */
  getRooms: (centerId?: number) =>
    apiClient.get<ApiResponse<{ list: any[] }>>('/rooms', {
      params: {
        ...(centerId && { centerId }),
      },
    }),

  /**
   * 根据ID获取房间详情
   */
  getRoom: (id: number) =>
    apiClient.get<ApiResponse<any>>(`/rooms/${id}`),

  /**
   * 创建房间
   */
  createRoom: (room: any) =>
    apiClient.post<ApiResponse<number>>('/rooms', room),

  /**
   * 批量创建房间
   */
  createRoomsBatch: (rooms: any[]) =>
    apiClient.post<ApiResponse<void>>('/rooms/batch', rooms),

  /**
   * 更新房间
   */
  updateRoom: (id: number, room: any) =>
    apiClient.put<ApiResponse<void>>(`/rooms/${id}`, room),

  /**
   * 删除房间
   */
  deleteRoom: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/rooms/${id}`),

  /**
   * 统计房间总数
   */
  countRooms: () =>
    apiClient.get<ApiResponse<number>>('/rooms/count'),
};
