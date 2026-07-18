export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(response: { error: { code: string; message: string; details?: unknown } }, status: number) {
    super(response.error.message);
    this.code = response.error.code;
    this.status = status;
    this.details = response.error.details;
  }
}

const BASE_URL = '/api';

async function request<T>(method: string, path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { code: 'UNKNOWN', message: 'Unknown error' } }));
    throw new ApiError(body, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string, params?: Record<string, string | number | boolean | undefined>) => {
    let url = path;
    if (params) {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) search.set(k, String(v));
      });
      const qs = search.toString();
      if (qs) url += `?${qs}`;
    }
    return request<T>('GET', url);
  },
  post: <T>(path: string, body?: unknown) =>
    request<T>('POST', path, { body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
