const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://reve-backend.onrender.com/api";

const getAuthToken = () => localStorage.getItem("auth_token");

// Lightweight client-side cache + dedup for GETs to avoid repeat network waits (helps when backend is slow/cold).
type CacheEntry = { ts: number; data: unknown };
const getCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

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

export const apiGet = async <T>(path: string): Promise<T> => {
  const cacheKey = path;
  const cached = getCache.get(cacheKey);
  const now = Date.now();

  // Serve fresh cache immediately
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return cloneData(cached.data) as T;
  }

  // If cache is stale but present, return it instantly and revalidate in background
  if (cached && !inFlight.has(cacheKey)) {
    void revalidate(cacheKey);
    return cloneData(cached.data) as T;
  }

  // Deduplicate concurrent requests
  if (inFlight.has(cacheKey)) {
    return (await inFlight.get(cacheKey)) as T;
  }

  const fetchPromise = fetchWithTimeout(`${API_BASE_URL}${path}`, {
    headers: buildHeaders(false),
  }).then(async (res) => {
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as T;
    getCache.set(cacheKey, { ts: Date.now(), data });
    inFlight.delete(cacheKey);
    return data;
  });

  inFlight.set(cacheKey, fetchPromise);
  return (await fetchPromise) as T;
};

const revalidate = async (cacheKey: string) => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}${cacheKey}`, { headers: buildHeaders(false) });
    if (!res.ok) return;
    const data = await res.json();
    getCache.set(cacheKey, { ts: Date.now(), data });
  } catch {
    // swallow background errors
  }
};

const fetchWithTimeout = (url: string, options: RequestInit, timeoutMs = 12000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
};

export const apiPost = async <T>(path: string, body: unknown): Promise<T> => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};

export const apiPut = async <T>(path: string, body: unknown): Promise<T> => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: buildHeaders(true),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};

export const apiPatch = async <T>(path: string, body: unknown): Promise<T> => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: buildHeaders(true),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};

export const apiDelete = async (path: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: buildHeaders(false),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
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
