const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://reve-backend.onrender.com/api";

const getAuthToken = () => localStorage.getItem("auth_token");

// Lightweight client-side cache + dedup for GETs to avoid repeat network waits (helps when backend is slow/cold).
type CacheEntry = { ts: number; data: unknown };
const getCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();
const mutationInFlight = new Map<string, Promise<unknown>>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds
type ApiGetOptions = {
  noStore?: boolean;
};

const isVolatilePath = (path: string) =>
  path.startsWith("/orders/") ||
  path === "/orders/" ||
  path.startsWith("/cart/") ||
  path.startsWith("/auth/");

const getMutationKey = (method: string, path: string, body?: unknown) =>
  `${method}:${path}:${body === undefined ? "" : JSON.stringify(body)}`;

const cloneData = <T>(data: T): T => {
  try {
    return structuredClone(data);
  } catch {
    return JSON.parse(JSON.stringify(data));
  }
};

const buildHeaders = (hasBody: boolean, requiresAuth: boolean = false) => {
  const headers: Record<string, string> = {};
  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }
  if (requiresAuth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  return headers;
};

export const apiGet = async <T>(path: string, options: ApiGetOptions = {}): Promise<T> => {
  const cacheKey = path;
  const shouldBypassCache = options.noStore === true || isVolatilePath(path);

  if (shouldBypassCache) {
    const res = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
      headers: buildHeaders(false),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as T;
  }

  const cached = getCache.get(cacheKey);
  const now = Date.now();

  // Serve only fresh cache immediately.
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return cloneData(cached.data) as T;
  }

  // Deduplicate concurrent requests
  if (inFlight.has(cacheKey)) {
    return (await inFlight.get(cacheKey)) as T;
  }

  const fetchPromise = fetchWithTimeout(`${API_BASE_URL}${path}`, {
    headers: buildHeaders(false),
    cache: "no-store",
  }).then(async (res) => {
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as T;
    getCache.set(cacheKey, { ts: Date.now(), data });
    inFlight.delete(cacheKey);
    return data;
  }).catch((error) => {
    inFlight.delete(cacheKey);
    throw error;
  });

  inFlight.set(cacheKey, fetchPromise);
  return (await fetchPromise) as T;
};

const fetchWithTimeout = (url: string, options: RequestInit, timeoutMs = 12000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
};

const runMutation = async <T>(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  requiresAuth = false
): Promise<T> => {
  const key = getMutationKey(method, path, body);
  const existing = mutationInFlight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const request = fetchWithTimeout(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(body !== undefined, requiresAuth),
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then(async (res) => {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    if (method === "DELETE" || res.status === 204) {
      return undefined as T;
    }
    return res.json() as Promise<T>;
  }).finally(() => {
    mutationInFlight.delete(key);
  });

  mutationInFlight.set(key, request);
  return request;
};

export const apiPost = async <T>(path: string, body: unknown): Promise<T> => {
  return runMutation<T>("POST", path, body);
};

export const apiPut = async <T>(path: string, body: unknown): Promise<T> => {
  return runMutation<T>("PUT", path, body);
};

export const apiPatch = async <T>(path: string, body: unknown): Promise<T> => {
  return runMutation<T>("PATCH", path, body);
};

export const apiDelete = async (path: string): Promise<void> => {
  await runMutation<void>("DELETE", path);
};

export const apiUpload = async (path: string, file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};
