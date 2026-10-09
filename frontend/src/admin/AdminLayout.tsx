import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { Shell } from '../components/Shell'
import { Button } from '../components/ui'
import { subscribeUnauthorized } from '../lib/api'
import { session } from '../lib/session'

export function AdminLayout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const logout = () => {
    session.setAdminToken(null)
    queryClient.removeQueries({ queryKey: ['admin'] })
    navigate('/admin/login', { replace: true })
  }

  // Expired or invalid token → back to the login page.
  useEffect(() => subscribeUnauthorized('admin', logout))

  if (!session.getAdminToken()) return <Navigate to="/admin/login" replace />

  return (
    <Shell
      brand="ERP Platform"
      subtitle="Super admin"
      nav={[{ to: '/admin', label: 'Companies', end: true }]}
      footer={
        <Button variant="ghost" className="w-full text-slate-300" onClick={logout}>
          Sign out
        </Button>
      }
    />
  )
}
