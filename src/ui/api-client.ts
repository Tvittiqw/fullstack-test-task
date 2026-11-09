import type { ErrorEnvelope } from '@/shared/api-types';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined) headers.set('content-type', 'application/json');
  const res = await fetch(path, {
    credentials: 'same-origin',
    ...init,
    headers,
  });
  if (res.status === 204) return undefined as T;
  const body: unknown = await res.json();
  if (res.ok) return body as T;
  const { error } = body as ErrorEnvelope;
  if (res.status === 401) hardNavigate('/login?expired=1');
  throw new ApiError(res.status, error.code, error.message);
}

export function hardNavigate(path: string): void {
  window.location.assign(new URL(path, window.location.origin));
}

export function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong';
}
