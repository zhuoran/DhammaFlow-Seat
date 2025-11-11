import type { Allocation, AllocationStats, AllocationConflict, ApiResponse, ListResult } from "@/types/domain";
import { apiClient } from "@/lib/http";
import { unwrapList } from "@/lib/data-utils";

export async function triggerAutoAllocation(sessionId: number): Promise<AllocationSummaryResponse> {
  const response = await apiClient.post<ApiResponse<AllocationSummaryResponse>>(`/allocations/auto/${sessionId}`);
  return response.data.data ?? {};
}

export async function fetchAllocations(sessionId: number): Promise<Allocation[]> {
  const response = await apiClient.get<ApiResponse<ListResult<Allocation>>>(`/allocations/${sessionId}`);
  return unwrapList(response.data.data);
}

export async function createAllocation(payload: Partial<Allocation>): Promise<number> {
  const response = await apiClient.post<ApiResponse<number>>("/allocations", payload);
  return response.data.data ?? 0;
}

export async function updateAllocation(id: number, payload: Partial<Allocation>): Promise<void> {
  await apiClient.put<ApiResponse<void>>(`/allocations/${id}`, payload);
}

export async function deleteAllocation(id: number): Promise<void> {
  await apiClient.delete<ApiResponse<void>>(`/allocations/${id}`);
}

export async function clearAllocations(sessionId: number): Promise<void> {
  await apiClient.delete<ApiResponse<void>>(`/allocations/session/${sessionId}`);
}

export async function confirmAllocations(sessionId: number): Promise<void> {
  await apiClient.post<ApiResponse<void>>(`/allocations/${sessionId}/confirm`);
}

export async function rollbackAllocations(sessionId: number): Promise<void> {
  await apiClient.post<ApiResponse<void>>(`/allocations/${sessionId}/rollback`);
}

export async function swapAllocations(allocationId1: number, allocationId2: number): Promise<void> {
  await apiClient.post<ApiResponse<void>>(`/allocations/swap`, {
    allocationId1,
    allocationId2,
  });
}

export interface AllocationSummaryResponse {
  statistics?: AllocationStats;
  details?: unknown;
}

export async function fetchConflicts(sessionId: number): Promise<AllocationConflict[]> {
  const response = await apiClient.get<ApiResponse<AllocationConflict[]>>(`/allocations/${sessionId}/conflicts`);
  return response.data.data ?? [];
}
