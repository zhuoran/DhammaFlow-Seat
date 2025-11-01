import apiClient from '@/services/api';
import { Student, ApiResponse } from '@/types';

/**
 * 学员相关 API 服务
 */
export const studentApi = {
  /**
   * 获取会话学员列表
   */
  getStudents: (sessionId: number, page = 1, size = 20) =>
    apiClient.get<ApiResponse<{ list: Student[] }>>('/students', {
      params: { sessionId, page, size },
    }),

  /**
   * 获取单个学员
   */
  getStudent: (id: number) =>
    apiClient.get<ApiResponse<Student>>(`/students/${id}`),

  /**
   * 创建学员
   */
  createStudent: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiClient.post<ApiResponse<Student>>('/students', student),

  /**
   * 更新学员
   */
  updateStudent: (id: number, student: Partial<Student>) =>
    apiClient.put<ApiResponse<void>>(`/students/${id}`, student),

  /**
   * 删除学员
   */
  deleteStudent: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/students/${id}`),

  /**
   * 批量导入学员
   */
  importStudents: (sessionId: number, students: Student[]) =>
    apiClient.post<ApiResponse<number>>('/students/import', students, {
      params: { sessionId },
    }),

  /**
   * 获取排序后的学员列表（用于分配）
   */
  getSortedStudents: (sessionId: number) =>
    apiClient.get<ApiResponse<Student[]>>('/students/sorted', {
      params: { sessionId },
    }),

  /**
   * 统计学员总数
   */
  countStudents: (sessionId: number) =>
    apiClient.get<ApiResponse<number>>('/students/count', {
      params: { sessionId },
    }),
};
