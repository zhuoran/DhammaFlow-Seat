import type { ApiResponse, Center, ListResult } from "@/types/domain";
import { apiClient } from "@/lib/http";
import { unwrapList } from "@/lib/data-utils";

export async function fetchCenters(): Promise<Center[]> {
  const response = await apiClient.get<ApiResponse<ListResult<Center>>>("/centers");
  return unwrapList(response.data.data);
}
