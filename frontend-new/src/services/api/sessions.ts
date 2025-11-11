import type { ApiResponse, ListResult, Session } from "@/types/domain";
import { apiClient } from "@/lib/http";
import { unwrapList } from "@/lib/data-utils";

export async function fetchSessions(centerId?: number, status?: string): Promise<Session[]> {
  const response = await apiClient.get<ApiResponse<ListResult<Session>>>("/sessions", {
    params: { centerId, status },
  });
  return unwrapList(response.data.data);
}

export async function fetchSessionConfig(sessionId: number): Promise<Record<string, unknown> | undefined> {
  const response = await apiClient.get<ApiResponse<Record<string, unknown>>>(`/sessions/${sessionId}/config`);
  return response.data.data;
}

export async function saveSessionConfig(sessionId: number, config: Record<string, unknown>): Promise<void> {
  await apiClient.post<ApiResponse<void>>(`/sessions/${sessionId}/config`, config);
}
