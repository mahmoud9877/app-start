import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '../components/Shell'
import {
  Badge,
  Button,
  Card,
  ErrorMessage,
  Field,
  formatDate,
  Input,
  Spinner,
  Table,
  Td,
} from '../components/ui'
import { adminApi } from '../lib/api'
import type { Tenant } from '../lib/types'
import {
  adminKeys,
  isGrantActive,
  statusLabel,
  statusTone,
  useModuleCatalog,
  useTenants,
} from './queries'

export function TenantsPage() {
  const tenants = useTenants()
  const [creating, setCreating] = useState(false)

  return (
    <>
      <PageHeader
        title="Companies"
        description="Every company has its own database. Blocked companies can't sign in."
        actions={
          !creating && (
            <Button onClick={() => setCreating(true)}>New company</Button>
          )
        }
      />
      <div className="space-y-6">
        {creating && <CreateTenantForm onDone={() => setCreating(false)} />}
        <Card>
          {tenants.isPending ? (
            <Spinner />
          ) : tenants.error ? (
            <ErrorMessage error={tenants.error} />
          ) : (
            <Table
              head={['Company', 'Code', 'Status', 'Modules', 'Created', '']}
              empty={tenants.data.length === 0}
            >
              {tenants.data.map((t) => (
                <TenantRow key={t.id} tenant={t} />
              ))}
            </Table>
          )}
        </Card>
      </div>
    </>
  )
}

function TenantRow({ tenant }: { tenant: Tenant }) {
  const queryClient = useQueryClient()
  const toggle = useMutation({
    mutationFn: () =>
      adminApi.patch(
        `/admin/tenants/${tenant.id}/${tenant.status === 'ACTIVE' ? 'suspend' : 'activate'}`,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.tenants }),
  })
  const activeModules = tenant.modules.filter(isGrantActive).length

  return (
    <tr>
      <Td className="font-medium">
        <Link to={`/admin/tenants/${tenant.id}`} className="hover:text-indigo-600">
          {tenant.name}
        </Link>
      </Td>
      <Td>
        <code className="text-xs text-slate-600">{tenant.slug}</code>
      </Td>
      <Td>
        <Badge tone={statusTone[tenant.status]}>{statusLabel[tenant.status]}</Badge>
      </Td>
      <Td>{activeModules}</Td>
      <Td>{formatDate(tenant.createdAt)}</Td>
      <Td className="text-right whitespace-nowrap">
        {tenant.status !== 'PROVISIONING' && (
          <Button
            variant={tenant.status === 'ACTIVE' ? 'secondary' : 'primary'}
            loading={toggle.isPending}
            onClick={() => toggle.mutate()}
          >
            {tenant.status === 'ACTIVE' ? 'Block' : 'Unblock'}
          </Button>
        )}{' '}
        <Link
          to={`/admin/tenants/${tenant.id}`}
          className="ml-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Manage
        </Link>
        {toggle.error && <ErrorMessage error={toggle.error} />}
      </Td>
    </tr>
  )
}

function CreateTenantForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient()
  const catalog = useModuleCatalog()
  const [form, setForm] = useState({
    name: '',
    slug: '',
    adminEmail: '',
    adminName: '',
    adminPassword: '',
  })
  const [modules, setModules] = useState<string[]>([])
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const create = useMutation({
    mutationFn: () =>
      adminApi.post<Tenant>('/admin/tenants', {
        ...form,
        adminName: form.adminName || undefined,
        modules,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.tenants })
      onDone()
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    create.mutate()
  }

  return (
    <Card title="New company">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name">
          <Input required value={form.name} onChange={set('name')} />
        </Field>
        <Field
          label="Company code"
          hint="Lowercase letters, digits and _ (3–30). Users type this to sign in. Can't be changed later."
        >
          <Input
            required
            pattern="[a-z0-9_]{3,30}"
            value={form.slug}
            onChange={(e) =>
              setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))
            }
          />
        </Field>
        <Field label="First admin email">
          <Input type="email" required value={form.adminEmail} onChange={set('adminEmail')} />
        </Field>
        <Field label="First admin name (optional)">
          <Input value={form.adminName} onChange={set('adminName')} />
        </Field>
        <Field label="First admin password" hint="At least 8 characters.">
          <Input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.adminPassword}
            onChange={set('adminPassword')}
          />
        </Field>
        <Field label="Modules" hint="Granted with no expiry; set dates later on the company page.">
          <div className="flex flex-wrap gap-3 pt-1">
            {catalog.data?.map((m) => (
              <label key={m.key} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={modules.includes(m.key)}
                  onChange={(e) =>
                    setModules((list) =>
                      e.target.checked
                        ? [...list, m.key]
                        : list.filter((k) => k !== m.key),
                    )
                  }
                />
                {m.name}
              </label>
            ))}
          </div>
        </Field>
        <div className="sm:col-span-2 space-y-3">
          <ErrorMessage error={create.error} />
          <div className="flex gap-2">
            <Button type="submit" loading={create.isPending}>
              {create.isPending ? 'Creating database…' : 'Create company'}
            </Button>
            <Button type="button" variant="secondary" onClick={onDone}>
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </Card>
  )
}
