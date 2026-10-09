import { useQuery } from '@tanstack/react-query'
import { tenantApi } from '../lib/api'
import type { Company, User } from '../lib/types'

export const tenantKeys = {
  company: ['tenant', 'company'] as const,
  me: ['tenant', 'me'] as const,
  users: (page: number) => ['tenant', 'users', page] as const,
  allUsers: ['tenant', 'users'] as const,
}

// Name and paid modules of the signed-in user's company.
export const useCompany = () =>
  useQuery({
    queryKey: tenantKeys.company,
    queryFn: () => tenantApi.get<Company>('/company'),
  })

export const useMe = () =>
  useQuery({
    queryKey: tenantKeys.me,
    queryFn: () => tenantApi.get<User>('/auth/me'),
  })
