import { isSaas } from '../config'
import { session } from './session'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

// Called on 401 so the UI can send the user back to the login page.
type UnauthorizedHandler = () => void
const onUnauthorized: Record<'admin' | 'tenant', UnauthorizedHandler[]> = {
  admin: [],
  tenant: [],
}
export function subscribeUnauthorized(
  area: 'admin' | 'tenant',
  handler: UnauthorizedHandler,
) {
  onUnauthorized[area].push(handler)
  return () => {
    onUnauthorized[area] = onUnauthorized[area].filter((h) => h !== handler)
  }
}

async function request<T>(
  area: 'admin' | 'tenant',
  method: Method,
  path: string,
  body?: unknown,
  extraHeaders: Record<string, string> = {},
): Promise<T> {
  const headers: Record<string, string> = { ...extraHeaders }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (area === 'admin') {
    const token = session.getAdminToken()
    if (token) headers.Authorization = `Bearer ${token}`
  } else {
    const tenant = session.getTenant()
    if (tenant) {
      headers.Authorization = `Bearer ${tenant.token}`
      if (isSaas) headers['x-tenant'] = tenant.tenant
    }
  }

  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection.')
  }

  if (response.status === 204) return undefined as T
  const data: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    // NestJS errors: { statusCode, message: string | string[], error }
    const raw = (data as { message?: string | string[] } | null)?.message
    const message = Array.isArray(raw)
      ? raw.join('. ')
      : (raw ?? response.statusText)
    // A 401 on login itself is just wrong credentials, not an expired session.
    if (response.status === 401 && headers.Authorization) {
      onUnauthorized[area].forEach((handler) => handler())
    }
    throw new ApiError(response.status, message)
  }
  return data as T
}

export const adminApi = {
  get: <T>(path: string) => request<T>('admin', 'GET', path),
  post: <T>(path: string, body?: unknown) =>
    request<T>('admin', 'POST', path, body),
  patch: <T>(path: string, body?: unknown) =>
    request<T>('admin', 'PATCH', path, body),
  delete: <T>(path: string) => request<T>('admin', 'DELETE', path),
}

export const tenantApi = {
  get: <T>(path: string) => request<T>('tenant', 'GET', path),
  post: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>('tenant', 'POST', path, body, headers),
  patch: <T>(path: string, body?: unknown) =>
    request<T>('tenant', 'PATCH', path, body),
  delete: <T>(path: string) => request<T>('tenant', 'DELETE', path),
}
