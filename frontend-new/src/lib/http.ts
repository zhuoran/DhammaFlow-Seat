import axios from "axios";
import type { ApiResponse } from "@/types/domain";
import { env } from "./env";

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse;
    if (response.status !== 200) {
      throw new Error(data?.message || "请求失败");
    }
    if (data && data.code !== undefined && ![0, 200].includes(data.code)) {
      console.warn("API business warning:", data);
    }
    return response;
  },
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  },
);
