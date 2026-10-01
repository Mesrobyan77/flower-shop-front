import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { ApiFailure, ApiSuccess, Paged, Pagination } from '@/types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

/** Normalised error every mutation and query can rely on. */
export class ApiClientError extends Error {
  status: number;
  code?: string;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, code?: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }

  /** First message for a given form field, ready for react-hook-form. */
  fieldError(path: string): string | undefined {
    return this.errors?.[path]?.[0];
  }
}

let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export const http: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

/**
 * Exchanges the HttpOnly refresh cookie for a fresh access token. Shared by the
 * 401 interceptor and the session bootstrap so concurrent callers (page load +
 * in-flight request) collapse into ONE rotation request.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshing) {
    refreshing = axios
      .post<ApiSuccess<{ accessToken: string }>>(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
      .then((res) => res.data.data.accessToken)
      .catch(() => null)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiFailure>) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean };
    const status = error.response?.status ?? 0;

    // One silent refresh attempt, then give up and let the app sign the user out.
    if (status === 401 && original && !original._retried && !original.url?.includes('/auth/')) {
      original._retried = true;
      const fresh = await refreshAccessToken();
      if (fresh) {
        setAccessToken(fresh);
        original.headers.Authorization = `Bearer ${fresh}`;
        return http(original);
      }
      onUnauthorized?.();
    }

    const payload = error.response?.data;
    throw new ApiClientError(
      payload?.message ?? error.message ?? 'Network error',
      status,
      payload?.code,
      payload?.errors,
    );
  },
);

/* --------------------------- typed request helpers -------------------------- */

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await http.get<ApiSuccess<T>>(url, { params });
  return res.data.data;
}

export async function getPaged<T>(url: string, params?: Record<string, unknown>): Promise<Paged<T>> {
  const res = await http.get<ApiSuccess<T[]>>(url, { params });
  const pagination = (res.data.meta?.pagination as Pagination) ?? {
    page: 1,
    limit: res.data.data.length,
    total: res.data.data.length,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };
  return { items: res.data.data, pagination };
}

/** Same as getPaged but keeps the extra meta keys (facets, summaries). */
export async function getPagedWithMeta<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<Paged<T> & { meta: Record<string, unknown> }> {
  const res = await http.get<ApiSuccess<T[]>>(url, { params });
  const meta = res.data.meta ?? {};
  const pagination = (meta.pagination as Pagination) ?? {
    page: 1,
    limit: res.data.data.length,
    total: res.data.data.length,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };
  return { items: res.data.data, pagination, meta: meta as Record<string, unknown> };
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await http.post<ApiSuccess<T>>(url, body);
  return res.data.data;
}

export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const res = await http.patch<ApiSuccess<T>>(url, body);
  return res.data.data;
}

export async function del<T = void>(url: string): Promise<T> {
  const res = await http.delete<ApiSuccess<T>>(url);
  return res.data?.data;
}

export async function upload<T>(url: string, form: FormData): Promise<T> {
  const res = await http.post<ApiSuccess<T>>(url, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data.data;
}

/**
 * Server components fetch without the axios instance so Next can cache the call
 * and so a failed request degrades to null instead of crashing the render.
 */
export async function serverGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  revalidate = 60,
): Promise<T | null> {
  const url = new URL(`${API_URL}${path}`);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }

  try {
    const res = await fetch(url.toString(), { next: { revalidate } });
    if (!res.ok) return null;
    const json = (await res.json()) as ApiSuccess<T>;
    return json.data;
  } catch {
    return null;
  }
}

export async function serverGetPaged<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  revalidate = 60,
): Promise<Paged<T>> {
  const url = new URL(`${API_URL}${path}`);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }

  const fallback: Paged<T> = {
    items: [],
    pagination: { page: 1, limit: 0, total: 0, totalPages: 1, hasNext: false, hasPrev: false },
  };

  try {
    const res = await fetch(url.toString(), { next: { revalidate } });
    if (!res.ok) return fallback;
    const json = (await res.json()) as ApiSuccess<T[]>;
    return { items: json.data, pagination: (json.meta?.pagination as Pagination) ?? fallback.pagination };
  } catch {
    return fallback;
  }
}
