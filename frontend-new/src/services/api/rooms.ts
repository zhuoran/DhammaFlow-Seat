import type { ApiResponse, ListResult, Room } from "@/types/domain";
import { apiClient } from "@/lib/http";
import { unwrapList } from "@/lib/data-utils";

export async function fetchRooms(centerId?: number): Promise<Room[]> {
  const response = await apiClient.get<ApiResponse<ListResult<Room>>>("/rooms", {
    params: { centerId },
  });
  return unwrapList(response.data.data);
}

export async function createRoom(room: Partial<Room>): Promise<number> {
  const response = await apiClient.post<ApiResponse<number>>("/rooms", room);
  return response.data.data ?? 0;
}

export async function updateRoom(id: number, room: Partial<Room>): Promise<void> {
  await apiClient.put<ApiResponse<void>>(`/rooms/${id}`, room);
}

export async function deleteRoom(id: number): Promise<void> {
  await apiClient.delete<ApiResponse<void>>(`/rooms/${id}`);
}

export async function batchCreateRooms(rooms: Partial<Room>[]): Promise<void> {
  await apiClient.post<ApiResponse<void>>("/rooms/batch", rooms);
}
