import type {
  DuplicatesResponse,
  LinkResult,
  LinksResponse,
  LoginResponse,
  QueueResponse,
  StatsResponse,
  StatusResult,
  UnlinkResult,
} from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly missing: string[];

  constructor(status: number, message: string, missing: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.missing = missing;
  }
}

const TOKEN_KEY = "dashboard.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
}

type QueryValue = string | number | null | undefined;

/** The single query-string builder for every API call. Empty strings, null and
 *  undefined are OMITTED — never send `storeType=` style empty params, the
 *  backend has 400'd on those before. Route every new endpoint through this. */
function qs(params: Record<string, QueryValue>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    sp.set(key, String(value));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function extractError(
  body: unknown,
  fallback: string,
): { message: string; missing: string[] } {
  if (body !== null && typeof body === "object") {
    const rec = body as Record<string, unknown>;
    const raw = rec["message"];
    const message =
      typeof raw === "string" && raw.length > 0
        ? raw
        : Array.isArray(raw)
          ? raw.filter((m): m is string => typeof m === "string").join(", ")
          : fallback;
    const missing = Array.isArray(rec["missing"])
      ? rec["missing"].filter((m): m is string => typeof m === "string")
      : [];
    return { message, missing };
  }
  return { message: fallback, missing: [] };
}

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = opts;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${apiBase()}/dashboard${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Network error — could not reach the API");
  }

  if (res.status === 401 && auth) {
    clearToken();
    if (typeof window !== "undefined") window.location.replace("/login");
    throw new ApiError(401, "Session expired");
  }

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      parsed = null;
    }
  }

  if (!res.ok) {
    const { message, missing } = extractError(
      parsed,
      `Request failed (${res.status})`,
    );
    throw new ApiError(res.status, message, missing);
  }

  return parsed as T;
}

export interface QueueParams {
  storeType?: string;
  bucket?: string;
  query?: string;
  page?: number;
  limit?: number;
  legacy?: 1;
}

export const api = {
  login: (password: string) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: { password },
      auth: false,
    }),

  stats: () => request<StatsResponse>("/stats"),

  queue: (params: QueueParams) =>
    request<QueueResponse>(`/queue${qs({ ...params })}`),

  links: (params: { storeType?: string; page?: number; curated?: 1 }) =>
    request<LinksResponse>(`/links${qs({ ...params })}`),

  createLink: (payload: {
    storeType: string;
    storeProductId: string;
    eans: string[];
  }) => request<LinkResult>("/links", { method: "POST", body: payload }),

  unlink: (payload: { storeType: string; storeProductId: string }) =>
    request<UnlinkResult>("/links/unlink", { method: "POST", body: payload }),

  ignore: (payload: { storeType: string; storeProductId: string }) =>
    request<StatusResult>("/items/ignore", { method: "POST", body: payload }),

  unignore: (payload: { storeType: string; storeProductId: string }) =>
    request<StatusResult>("/items/unignore", { method: "POST", body: payload }),

  duplicates: (page: number) =>
    request<DuplicatesResponse>(`/duplicates${qs({ page })}`),

  approveDuplicate: (id: string | number, keepEan: string) =>
    request<{ status: string; keepEan: string; linkedEan: string }>(
      `/duplicates/${id}/approve`,
      { method: "POST", body: { keepEan } },
    ),

  dismissDuplicate: (id: string | number) =>
    request<StatusResult>(`/duplicates/${id}/dismiss`, { method: "POST" }),

  rematch: () => request<StatusResult>("/rematch", { method: "POST" }),

  sync: (storeType: "lidl" | "rema") =>
    request<{ status: string; storeType: string }>(`/sync/${storeType}`, {
      method: "POST",
    }),
};
