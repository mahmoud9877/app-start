// Tokens live in localStorage so a refresh keeps you logged in. The admin and
// company sessions are separate: a super admin can be logged into both.
// Trade-off: anything able to run JS on this origin (an XSS bug) could read
// them. Moving to httpOnly cookies would need backend changes.

export interface TenantSession {
  token: string
  tenant: string // company slug, sent as x-tenant
}

const ADMIN_KEY = 'erp.adminToken'
const TENANT_KEY = 'erp.tenantSession'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Storage unavailable (private mode): the session lasts until reload.
  }
}

export const session = {
  getAdminToken: () => read(ADMIN_KEY),
  setAdminToken: (token: string | null) => write(ADMIN_KEY, token),

  getTenant(): TenantSession | null {
    const raw = read(TENANT_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as TenantSession
    } catch {
      return null
    }
  },
  setTenant: (value: TenantSession | null) =>
    write(TENANT_KEY, value && JSON.stringify(value)),
}
