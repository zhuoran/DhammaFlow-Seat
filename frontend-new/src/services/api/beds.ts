import type { ApiResponse, Bed, ListResult } from "@/types/domain";
import { apiClient } from "@/lib/http";
import { unwrapList } from "@/lib/data-utils";

type FetchBedsParams = number | { roomId?: number; sessionId?: number };

export async function fetchBeds(param?: FetchBedsParams): Promise<Bed[]> {
  const params = typeof param === "number" ? { roomId: param } : param;
  const response = await apiClient.get<ApiResponse<ListResult<Bed>>>("/beds", {
    params,
  });
  return unwrapList(response.data.data);
}

export async function createBed(payload: Partial<Bed>): Promise<number> {
  const response = await apiClient.post<ApiResponse<number>>("/beds", payload);
  return response.data.data ?? 0;
}

export async function updateBed(id: number, payload: Partial<Bed>): Promise<void> {
  await apiClient.put<ApiResponse<void>>(`/beds/${id}`, payload);
}

export async function deleteBed(id: number): Promise<void> {
  await apiClient.delete<ApiResponse<void>>(`/beds/${id}`);
}

export async function createBedsBatch(beds: Partial<Bed>[]): Promise<void> {
  await apiClient.post<ApiResponse<void>>("/beds/batch", beds);
}

export async function deleteBedsOfRoom(roomId: number): Promise<void> {
  await apiClient.delete<ApiResponse<void>>(`/beds/room/${roomId}`);
}
