import type { ApiResponse } from "@/types/domain";
import { apiClient } from "@/lib/http";

interface ImportResult {
  successCount: number;
  failureCount: number;
  totalCount: number;
  message: string;
}

export async function importRoomsAndBeds(file: File, centerId: number): Promise<ImportResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("centerId", centerId.toString());

  const response = await apiClient.post<ApiResponse<ImportResult>>("/import/rooms-beds", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  if (!response.data.data) {
    throw new Error(response.data.message || "导入失败");
  }
  return response.data.data;
}
