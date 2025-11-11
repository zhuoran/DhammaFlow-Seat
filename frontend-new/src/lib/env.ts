const DEFAULT_API_BASE = "http://192.168.2.250:8080/api";

export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_BASE,
};
