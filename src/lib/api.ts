const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://reve-backend.onrender.com/api";

const getAuthToken = () => localStorage.getItem("auth_token");

// Lightweight client-side cache + dedup for GETs to avoid repeat network waits (helps when backend is slow/cold).
type CacheEntry = { ts: number; data: unknown };
const getCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();
const mutationInFlight = new Map<string, Promise<unknown>>();
const SESSION_CACHE_PREFIX = "reve-public-cache:";
const PRODUCT_CACHE_TTL_MS = 60 * 1000;
const CATEGORY_CACHE_TTL_MS = 60 * 1000;
const DEFAULT_CACHE_TTL_MS = 30 * 1000;
type ApiGetOptions = {
  noStore?: boolean;
  staleWhileRevalidate?: boolean;
  maxStaleMs?: number;
  onUpdate?: (data: unknown) => void;
};

const normalizeGetCacheKey = (path: string) => {
  const [pathname, query = ''] = path.split('?');
  if (!query) return pathname;
  const params = new URLSearchParams(query);
  params.sort();
  const normalizedQuery = params.toString();
  return normalizedQuery ? `${pathname}?${normalizedQuery}` : pathname;
};

const isVolatilePath = (path: string) =>
  path.startsWith("/orders/") ||
  path === "/orders/" ||
  path.startsWith("/cart/") ||
  path.startsWith("/auth/");

const getMutationKey = (method: string, path: string, body?: unknown) =>
  `${method}:${path}:${body === undefined ? "" : JSON.stringify(body)}`;

const getCacheTtlMs = (path: string) => {
  if (path.startsWith("/products/filters/")) {
    return CATEGORY_CACHE_TTL_MS;
  }
  if (path.startsWith("/products/") || path === "/products/" || path.startsWith("/collections/")) {
    return PRODUCT_CACHE_TTL_MS;
  }
  if (path.startsWith("/categories/") || path === "/categories/" || path.startsWith("/subcategories/")) {
    return CATEGORY_CACHE_TTL_MS;
  }
  return DEFAULT_CACHE_TTL_MS;
};

const cloneData = <T>(data: T): T => {
  try {
    return structuredClone(data);
  } catch {
    return JSON.parse(JSON.stringify(data));
  }
};

const readSessionCache = <T>(cacheKey: string, ttlMs: number, evictExpired = true): T | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(`${SESSION_CACHE_PREFIX}${cacheKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (!parsed || typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts >= ttlMs) {
      if (evictExpired) window.sessionStorage.removeItem(`${SESSION_CACHE_PREFIX}${cacheKey}`);
      return null;
    }
    getCache.set(cacheKey, parsed);
    return cloneData(parsed.data) as T;
  } catch {
    return null;
  }
};

const writeSessionCache = (cacheKey: string, entry: CacheEntry) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(`${SESSION_CACHE_PREFIX}${cacheKey}`, JSON.stringify(entry));
  } catch {
    // Ignore storage failures.
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
  const cacheKey = normalizeGetCacheKey(path);
  const shouldBypassCache = options.noStore === true || isVolatilePath(path);
  const cacheTtlMs = getCacheTtlMs(path);
  const maxStaleMs = options.maxStaleMs ?? cacheTtlMs;

  const fetchAndCache = () =>
    fetchWithTimeout(`${API_BASE_URL}${path}`, {
      headers: buildHeaders(false),
      cache: "no-store",
    }).then(async (res) => {
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as T;
      const entry = { ts: Date.now(), data };
      getCache.set(cacheKey, entry);
      writeSessionCache(cacheKey, entry);
      inFlight.delete(cacheKey);
      return data;
    }).catch((error) => {
      inFlight.delete(cacheKey);
      throw error;
    });

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
  if (cached && now - cached.ts < cacheTtlMs) {
    return cloneData(cached.data) as T;
  }

  if (options.staleWhileRevalidate && cached && now - cached.ts < maxStaleMs) {
    if (!inFlight.has(cacheKey)) {
      const refreshPromise = fetchAndCache();
      inFlight.set(cacheKey, refreshPromise);
      void refreshPromise.then((data) => options.onUpdate?.(cloneData(data))).catch(() => undefined);
    }
    return cloneData(cached.data) as T;
  }

  const sessionCached = readSessionCache<T>(cacheKey, cacheTtlMs, !options.staleWhileRevalidate);
  if (sessionCached !== null) {
    return sessionCached;
  }

  const staleSessionCached = options.staleWhileRevalidate
    ? readSessionCache<T>(cacheKey, maxStaleMs)
    : null;
  if (staleSessionCached !== null) {
    if (!inFlight.has(cacheKey)) {
      const refreshPromise = fetchAndCache();
      inFlight.set(cacheKey, refreshPromise);
      void refreshPromise.then((data) => options.onUpdate?.(cloneData(data))).catch(() => undefined);
    }
    return staleSessionCached;
  }

  // Deduplicate concurrent requests
  if (inFlight.has(cacheKey)) {
    return (await inFlight.get(cacheKey)) as T;
  }

  const fetchPromise = fetchAndCache();

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

export const apiUpload = async (
  path: string,
  file: File
): Promise<{ url: string; type?: string; name?: string; mime_type?: string }> => {
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
