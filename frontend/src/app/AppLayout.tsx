import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { Shell, type NavItem } from '../components/Shell'
import { Button, ErrorMessage, Spinner } from '../components/ui'
import { subscribeUnauthorized } from '../lib/api'
import { session } from '../lib/session'
import { useCompany, useMe } from './queries'

export function AppLayout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const signedIn = session.getTenant() !== null
  const company = useCompany()
  const me = useMe()

  const logout = () => {
    session.setTenant(null)
    queryClient.removeQueries({ queryKey: ['tenant'] })
    navigate('/login', { replace: true })
  }

  useEffect(() => subscribeUnauthorized('tenant', logout))

  if (!signedIn) return <Navigate to="/login" replace />
  if (company.isPending) return <Spinner />
  if (company.error) {
    // e.g. 403 "This company account is suspended"
    return (
      <div className="mx-auto mt-24 max-w-md space-y-4 px-4">
        <ErrorMessage error={company.error} />
        <Button variant="secondary" onClick={logout}>
          Back to sign in
        </Button>
      </div>
    )
  }

  // Only modules the company has paid for (and that haven't expired) appear.
  const nav: NavItem[] = [
    { to: '/', label: 'Dashboard', end: true },
    ...company.data.modules
      .filter((m) => m.active)
      .map((m) => ({ to: `/m/${m.key}`, label: m.name })),
    { to: '/users', label: 'Users' },
  ]

  return (
    <Shell
      brand={company.data.name}
      subtitle={me.data?.email}
      nav={nav}
      footer={
        <Button variant="ghost" className="w-full text-slate-300" onClick={logout}>
          Sign out
        </Button>
      }
    />
  )
}
