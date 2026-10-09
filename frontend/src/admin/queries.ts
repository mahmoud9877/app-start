import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../lib/api'
import type { ModuleGrant, ModuleOption, Tenant, TenantStatus } from '../lib/types'

export const adminKeys = {
  tenants: ['admin', 'tenants'] as const,
  tenant: (id: string) => ['admin', 'tenants', id] as const,
  modules: ['admin', 'modules'] as const,
}

export const useTenants = () =>
  useQuery({
    queryKey: adminKeys.tenants,
    queryFn: () => adminApi.get<Tenant[]>('/admin/tenants'),
  })

export const useTenant = (id: string) =>
  useQuery({
    queryKey: adminKeys.tenant(id),
    queryFn: () => adminApi.get<Tenant>(`/admin/tenants/${id}`),
  })

// The catalog rarely changes; cache it for the session.
export const useModuleCatalog = () =>
  useQuery({
    queryKey: adminKeys.modules,
    queryFn: () => adminApi.get<ModuleOption[]>('/admin/modules'),
    staleTime: Infinity,
  })

export const statusTone: Record<TenantStatus, 'green' | 'red' | 'amber'> = {
  ACTIVE: 'green',
  SUSPENDED: 'red',
  PROVISIONING: 'amber',
}

export const statusLabel: Record<TenantStatus, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Blocked',
  PROVISIONING: 'Provisioning',
}

export const isGrantActive = (grant: ModuleGrant) =>
  grant.expiresAt === null || new Date(grant.expiresAt) > new Date()
