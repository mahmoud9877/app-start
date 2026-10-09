import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { AuthCard } from '../components/Shell'
import { Button, ErrorMessage, Field, Input } from '../components/ui'
import { isSaas } from '../config'
import { tenantApi } from '../lib/api'
import { session } from '../lib/session'

const LAST_COMPANY_KEY = 'erp.lastCompany'

export function Login() {
  const navigate = useNavigate()
  const [company, setCompany] = useState(() => {
    try {
      return localStorage.getItem(LAST_COMPANY_KEY) ?? ''
    } catch {
      return ''
    }
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const login = useMutation({
    mutationFn: () => {
      const tenant = company.trim().toLowerCase()
      return tenantApi
        .post<{ accessToken: string }>(
          '/auth/login',
          { email, password },
          isSaas ? { 'x-tenant': tenant } : {},
        )
        .then((res) => ({ ...res, tenant }))
    },
    onSuccess: ({ accessToken, tenant }) => {
      session.setTenant({ token: accessToken, tenant })
      try {
        localStorage.setItem(LAST_COMPANY_KEY, tenant)
      } catch {
        // Not remembering the company is fine.
      }
      navigate('/', { replace: true })
    },
  })

  if (session.getTenant()) return <Navigate to="/" replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    login.mutate()
  }

  return (
    <AuthCard title="Sign in" subtitle="Welcome back">
      <form onSubmit={submit} className="space-y-4">
        {isSaas && (
          <Field label="Company code">
            <Input
              required
              autoCapitalize="none"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </Field>
        )}
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
