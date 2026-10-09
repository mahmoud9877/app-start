// Shapes returned by the backend API.

export type TenantStatus = 'PROVISIONING' | 'ACTIVE' | 'SUSPENDED'

export interface ModuleGrant {
  module: string
  enabledAt: string
  expiresAt: string | null
}

export interface Tenant {
  id: string
  name: string
  slug: string
  dbName: string
  status: TenantStatus
  createdAt: string
  updatedAt: string
  modules: ModuleGrant[]
}

export interface ModuleOption {
  key: string
  name: string
}

export interface User {
  id: string
  email: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface Company {
  name: string
  slug: string
  modules: {
    key: string
    name: string
    active: boolean
    expiresAt: string | null
  }[]
}
