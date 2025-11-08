import apiClient from '@/services/api';
import { Session, ApiResponse } from '@/types';

/**
 * 课程会期相关 API 服务
 */
export const sessionApi = {
  /**
   * 获取所有会期
   */
  getSessions: (centerId?: number, status?: string) =>
    apiClient.get<ApiResponse<{ list: Session[] }>>('/sessions', {
      params: {
        ...(centerId && { centerId }),
        ...(status && { status }),
      },
    }),

  /**
   * 获取单个会期
   */
  getSession: (id: number) =>
    apiClient.get<ApiResponse<Session>>(`/sessions/${id}`),

  /**
   * 根据会期代码查询
   */
  getSessionByCode: (code: string) =>
    apiClient.get<ApiResponse<Session>>(`/sessions/code/${code}`),

  /**
   * 创建会期
   */
  createSession: (session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiClient.post<ApiResponse<Session>>('/sessions', session),

  /**
   * 更新会期
   */
  updateSession: (id: number, session: Partial<Session>) =>
    apiClient.put<ApiResponse<void>>(`/sessions/${id}`, session),

  /**
   * 删除会期
   */
  deleteSession: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/sessions/${id}`),

  /**
   * 获取进行中的会期
   */
  getActiveSessions: () =>
    apiClient.get<ApiResponse<{ list: Session[] }>>('/sessions/active'),

  /**
   * 统计会期总数
   */
  countSessions: () =>
    apiClient.get<ApiResponse<number>>('/sessions/count'),

  /**
   * 获取课程设置
   */
  getSessionConfig: (sessionId: number) =>
    apiClient.get<ApiResponse<any>>(`/sessions/${sessionId}/config`),

  /**
   * 保存课程设置
   */
  saveSessionConfig: (sessionId: number, config: any) =>
    apiClient.post<ApiResponse<void>>(`/sessions/${sessionId}/config`, config),
};
