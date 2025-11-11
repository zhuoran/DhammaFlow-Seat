import type { ApiResponse, ListResult, Student } from "@/types/domain";
import { apiClient } from "@/lib/http";
import { unwrapList } from "@/lib/data-utils";

export async function fetchStudents(sessionId: number, page = 1, size = 200): Promise<Student[]> {
  const response = await apiClient.get<ApiResponse<ListResult<Student>>>("/students", {
    params: { sessionId, page, size },
  });
  return unwrapList(response.data.data);
}

export async function fetchStudent(id: number): Promise<Student | undefined> {
  const response = await apiClient.get<ApiResponse<Student>>(`/students/${id}`);
  return response.data.data;
}

export async function createStudent(payload: Partial<Student>): Promise<Student | undefined> {
  const response = await apiClient.post<ApiResponse<Student>>("/students", payload);
  return response.data.data;
}

export async function updateStudent(id: number, payload: Partial<Student>): Promise<void> {
  await apiClient.put<ApiResponse<void>>(`/students/${id}`, payload);
}

export async function deleteStudent(id: number): Promise<void> {
  await apiClient.delete<ApiResponse<void>>(`/students/${id}`);
}

export async function countStudents(sessionId: number): Promise<number> {
  const response = await apiClient.get<ApiResponse<number>>("/students/count", {
    params: { sessionId },
  });
  return response.data.data ?? 0;
}

export async function importStudents(sessionId: number, students: Student[]): Promise<number> {
  const response = await apiClient.post<ApiResponse<number>>("/students/import", students, {
    params: { sessionId },
  });
  return response.data.data ?? 0;
}

export async function importStudentsExcel(sessionId: number, file: File): Promise<number> {
  const form = new FormData();
  form.append("file", file);
  form.append("sessionId", sessionId.toString());
  const response = await apiClient.post<ApiResponse<number>>(`/students/import-excel`, form, {
    params: { sessionId },
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data ?? 0;
}
