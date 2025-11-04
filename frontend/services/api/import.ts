import apiClient from '@/services/api';
import { ApiResponse } from '@/types';

/**
 * 数据导入 API 服务
 */
export const importApi = {
  /**
   * 导入房间和床位数据
   * @param file 上传的 Excel 文件
   * @param centerId 禅修中心ID
   */
  importRoomsAndBeds: (file: File, centerId: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('centerId', centerId.toString());

    return apiClient.post<ApiResponse<{
      successCount: number;
      failureCount: number;
      totalCount: number;
      message: string;
    }>>('/import/rooms-beds', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * 获取导入模板
   */
  getImportTemplate: () =>
    apiClient.get<ApiResponse<{
      templateFile: string;
      description: string;
    }>>('/import/template'),
};
