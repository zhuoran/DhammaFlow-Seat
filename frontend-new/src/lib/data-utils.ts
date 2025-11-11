export function unwrapList<T>(payload?: { list?: T[] } | T[] | null): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.list)) return payload.list;
  return [];
}

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
