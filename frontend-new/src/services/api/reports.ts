import type { ApiResponse } from "@/types/domain";
import { apiClient } from "@/lib/http";

export async function fetchAllocationReport(sessionId: number): Promise<unknown> {
  const response = await apiClient.get<ApiResponse<unknown>>(`/reports/${sessionId}/allocation`);
  return response.data.data;
}

export async function fetchMeditationSeatReport(sessionId: number): Promise<unknown> {
  const response = await apiClient.get<ApiResponse<unknown>>(`/reports/${sessionId}/meditation-seat`);
  return response.data.data;
}
