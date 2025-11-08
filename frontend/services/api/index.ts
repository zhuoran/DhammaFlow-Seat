/**
 * API 服务聚合导出
 * 简化前端页面的导入
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiResponse } from '@/types';

// 创建 Axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://192.168.2.250:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证令牌等
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse;
    // 如果 HTTP 响应状态码不是200，抛出错误
    if (response.status !== 200) {
      throw new Error(data.message || '请求失败');
    }
    // 业务级别的错误检查：code 应该是 0 或 200（成功）
    const code = data?.code;
    if (code !== 0 && code !== 200) {
      console.warn('API Business Error:', data.message, 'Code:', code);
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      // 服务器响应错误状态码
      const data = error.response.data as any;
      const message = data?.message || `错误: ${error.response.status}`;
      console.error('API Error:', message);
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('No response received:', error.request);
    } else {
      // 错误发生在设置请求时
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// 导出 apiClient 作为默认导出
export default apiClient;

// 导出 API 服务
export { studentApi } from './student';
export { sessionApi } from './session';
export { centerApi } from './center';
export { allocationApi } from './allocation';
export { reportApi } from './report';
export { roomApi } from './room';
export { bedApi } from './bed';
export { importApi } from './import';
export { meditationSeatApi } from './meditation-seat';
