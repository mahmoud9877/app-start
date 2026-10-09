import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { AuthCard } from '../components/Shell'
import { Button, ErrorMessage, Field, Input } from '../components/ui'
import { adminApi } from '../lib/api'
import { session } from '../lib/session'

export function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const login = useMutation({
    mutationFn: () =>
      adminApi.post<{ accessToken: string }>('/admin/login', {
        email,
        password,
      }),
    onSuccess: ({ accessToken }) => {
      session.setAdminToken(accessToken)
      navigate('/admin', { replace: true })
    },
  })

  if (session.getAdminToken()) return <Navigate to="/admin" replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    login.mutate()
  }

  return (
    <AuthCard title="Platform admin" subtitle="Manage companies and their modules">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <Input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <ErrorMessage error={login.error} />
        <Button type="submit" loading={login.isPending} className="w-full">
          Sign in
        </Button>
      </form>
    </AuthCard>
  )
}
