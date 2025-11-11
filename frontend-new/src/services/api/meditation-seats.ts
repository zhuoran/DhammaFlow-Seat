import type { ApiResponse } from "@/types/domain";
import { apiClient } from "@/lib/http";

export async function generateSeats(sessionId: number): Promise<unknown> {
  const response = await apiClient.post<ApiResponse<unknown>>(`/meditation-seats/generate`, null, {
    params: { sessionId },
  });
  return response.data.data;
}

export async function fetchSeats(sessionId: number): Promise<unknown> {
  const response = await apiClient.get<ApiResponse<unknown>>(`/meditation-seats/session/${sessionId}`);
  return response.data.data;
}
