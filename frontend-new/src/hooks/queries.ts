"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { allocationApi, bedApi, centerApi, hallConfigApi, roomApi, sessionApi, studentApi } from "@/services/api";
import type { Allocation, HallLayout, Room, Student } from "@/types/domain";

export function useCenters() {
  return useQuery({
    queryKey: ["centers"],
    queryFn: centerApi.fetchCenters,
  });
}

export function useSessions(centerId?: number) {
  return useQuery({
    queryKey: ["sessions", centerId],
    queryFn: () => sessionApi.fetchSessions(centerId),
    enabled: Boolean(centerId),
  });
}

export function useRooms(centerId?: number) {
  return useQuery({
    queryKey: ["rooms", centerId],
    queryFn: () => roomApi.fetchRooms(centerId),
    enabled: Boolean(centerId),
  });
}

export function useBeds(roomId?: number) {
  return useQuery({
    queryKey: ["beds", roomId],
    queryFn: () => bedApi.fetchBeds(roomId),
    enabled: Boolean(roomId),
  });
}

export function useStudents(sessionId?: number) {
  return useQuery({
    queryKey: ["students", sessionId],
    queryFn: () => studentApi.fetchStudents(sessionId!),
    enabled: Boolean(sessionId),
  });
}

export function useAllocations(sessionId?: number) {
  return useQuery({
    queryKey: ["allocations", sessionId],
    queryFn: () => allocationApi.fetchAllocations(sessionId!),
    enabled: Boolean(sessionId),
  });
}

export function useAllocationConflicts(sessionId?: number) {
  return useQuery({
    queryKey: ["allocation-conflicts", sessionId],
    queryFn: () => allocationApi.fetchConflicts(sessionId!),
    enabled: Boolean(sessionId),
  });
}

export function useUpsertAllocation(sessionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Allocation>) => {
      if (payload.id) {
        await allocationApi.updateAllocation(payload.id, payload);
        return payload.id;
      }
      return allocationApi.createAllocation(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["allocations", sessionId] });
    },
  });
}

export function useRoomMutations(centerId: number) {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["rooms", centerId] });

  const create = useMutation({
    mutationFn: roomApi.createRoom,
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Room> }) => roomApi.updateRoom(id, payload),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: roomApi.deleteRoom,
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

export function useHallConfigs(sessionId?: number) {
  return useQuery({
    queryKey: ["hall-configs", sessionId],
    queryFn: () => hallConfigApi.fetchHallConfigs(sessionId!),
    enabled: Boolean(sessionId),
  });
}

export function useUpdateHallLayout(sessionId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, layout }: { id: number; layout: HallLayout }) => hallConfigApi.updateHallLayout(id, layout),
    onSuccess: async () => {
      if (sessionId) {
        await queryClient.invalidateQueries({ queryKey: ["hall-configs", sessionId] });
      }
    },
  });
}

export function useStudentMutations(sessionId: number) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["students", sessionId] });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Student> }) => studentApi.updateStudent(id, payload),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: studentApi.deleteStudent,
    onSuccess: invalidate,
  });

  return { update, remove };
}
