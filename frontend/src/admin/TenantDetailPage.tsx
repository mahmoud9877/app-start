import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
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
import type { ModuleGrant, ModuleOption, Tenant } from '../lib/types'
import {
  adminKeys,
  isGrantActive,
  statusLabel,
  statusTone,
  useModuleCatalog,
  useTenant,
} from './queries'

export function TenantDetailPage() {
  const { id = '' } = useParams()
  const tenant = useTenant(id)

  if (tenant.isPending) return <Spinner />
  if (tenant.error) return <ErrorMessage error={tenant.error} />
  const t = tenant.data

  return (
    <>
      <Link to="/admin" className="text-sm text-slate-500 hover:text-slate-700">
        ← Companies
      </Link>
      <PageHeader
        title={t.name}
        description={`Code: ${t.slug} · Database: ${t.dbName} · Created ${formatDate(t.createdAt)}`}
        actions={
          <Badge tone={statusTone[t.status]}>{statusLabel[t.status]}</Badge>
        }
      />
      <div className="space-y-6">
        <ModulesCard tenant={t} />
        <RenameCard tenant={t} />
        <AccessCard tenant={t} />
        <DeleteCard tenant={t} />
      </div>
    </>
  )
}

function useRefresh(id: string) {
  const queryClient = useQueryClient()
  return (data?: Tenant) => {
    if (data) queryClient.setQueryData(adminKeys.tenant(id), data)
    else queryClient.invalidateQueries({ queryKey: adminKeys.tenant(id) })
    queryClient.invalidateQueries({ queryKey: adminKeys.tenants, exact: true })
  }
}

function ModulesCard({ tenant }: { tenant: Tenant }) {
  const catalog = useModuleCatalog()
  return (
    <Card title="Modules">
      <p className="-mt-1 mb-4 text-sm text-slate-500">
        The company can only use modules it has paid for. Access stops
        automatically on the expiry date; the company's data is kept.
      </p>
      {catalog.isPending ? (
        <Spinner />
      ) : catalog.error ? (
        <ErrorMessage error={catalog.error} />
      ) : (
        <Table head={['Module', 'Status', 'Paid until', '']}>
          {catalog.data.map((m) => (
            <ModuleRow
              key={m.key}
              tenant={tenant}
              option={m}
              grant={tenant.modules.find((g) => g.module === m.key)}
            />
          ))}
        </Table>
      )}
    </Card>
  )
}

function ModuleRow({
  tenant,
  option,
  grant,
}: {
  tenant: Tenant
  option: ModuleOption
  grant?: ModuleGrant
}) {
  const refresh = useRefresh(tenant.id)
  // <input type="date"> works in local dates; access ends at the end of that day.
  const [until, setUntil] = useState(grant?.expiresAt?.slice(0, 10) ?? '')

  const grantMutation = useMutation({
    mutationFn: () =>
      adminApi.post<Tenant>(`/admin/tenants/${tenant.id}/modules`, {
        module: option.key,
        expiresAt: until ? new Date(`${until}T23:59:59`).toISOString() : undefined,
      }),
    onSuccess: refresh,
  })
  const revoke = useMutation({
    mutationFn: () =>
      adminApi.delete<Tenant>(`/admin/tenants/${tenant.id}/modules/${option.key}`),
    onSuccess: (data) => {
      setUntil('')
      refresh(data)
    },
  })

  const status = !grant ? (
    <Badge tone="slate">Not subscribed</Badge>
  ) : isGrantActive(grant) ? (
    <Badge tone="green">Active</Badge>
  ) : (
    <Badge tone="red">Expired</Badge>
  )

  return (
    <tr>
      <Td className="font-medium">{option.name}</Td>
      <Td>{status}</Td>
      <Td>
        <Input
          type="date"
          value={until}
          onChange={(e) => setUntil(e.target.value)}
          className="w-40"
          aria-label={`${option.name} paid until`}
        />
        <span className="mt-1 block text-xs text-slate-500">
          {until ? '' : 'Empty = no expiry'}
        </span>
      </Td>
      <Td className="text-right whitespace-nowrap">
        <Button
          variant={grant ? 'secondary' : 'primary'}
          loading={grantMutation.isPending}
          onClick={() => grantMutation.mutate()}
        >
          {grant ? 'Save / renew' : 'Grant'}
        </Button>{' '}
        {grant && (
          <Button
            variant="ghost"
            loading={revoke.isPending}
            onClick={() => revoke.mutate()}
          >
            Remove
          </Button>
        )}
        <ErrorMessage error={grantMutation.error ?? revoke.error} />
      </Td>
    </tr>
  )
}

function RenameCard({ tenant }: { tenant: Tenant }) {
  const refresh = useRefresh(tenant.id)
  const [name, setName] = useState(tenant.name)
  const rename = useMutation({
    mutationFn: () => adminApi.patch<Tenant>(`/admin/tenants/${tenant.id}`, { name }),
    onSuccess: () => refresh(),
  })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    rename.mutate()
  }

  return (
    <Card title="Company name">
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
        <div className="min-w-60 flex-1">
          <Field label="Name">
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        </div>
        <Button
          type="submit"
          variant="secondary"
          loading={rename.isPending}
          disabled={name.trim() === tenant.name}
        >
          Save
        </Button>
      </form>
      <div className="mt-3">
        <ErrorMessage error={rename.error} />
      </div>
    </Card>
  )
}

function AccessCard({ tenant }: { tenant: Tenant }) {
  const refresh = useRefresh(tenant.id)
  const blocked = tenant.status === 'SUSPENDED'
  const toggle = useMutation({
    mutationFn: () =>
      adminApi.patch<Tenant>(
        `/admin/tenants/${tenant.id}/${blocked ? 'activate' : 'suspend'}`,
      ),
    onSuccess: () => refresh(),
  })
  if (tenant.status === 'PROVISIONING') return null

  return (
    <Card title="Access">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-slate-600">
          {blocked
            ? 'This company is blocked. Its users get "This company account is suspended" on every request.'
            : 'Blocking takes effect immediately: every user of this company is locked out until you unblock it.'}
        </p>
        <Button
          variant={blocked ? 'primary' : 'danger'}
          loading={toggle.isPending}
          onClick={() => toggle.mutate()}
        >
          {blocked ? 'Unblock company' : 'Block company'}
        </Button>
      </div>
      <div className="mt-3">
        <ErrorMessage error={toggle.error} />
      </div>
    </Card>
  )
}

function DeleteCard({ tenant }: { tenant: Tenant }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirm, setConfirm] = useState('')
  const remove = useMutation({
    mutationFn: () => adminApi.delete(`/admin/tenants/${tenant.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.tenants })
      navigate('/admin', { replace: true })
    },
  })
  const canDelete = tenant.status === 'SUSPENDED'

  return (
    <section className="rounded-lg bg-white shadow-sm ring-1 ring-red-200">
      <header className="border-b border-red-200 px-5 py-3 font-semibold text-red-700">
        Delete company
      </header>
      <div className="space-y-3 p-5">
        <p className="text-sm text-slate-600">
          Permanently deletes the company and its database, including all of its
          data. This cannot be undone.
          {!canDelete && ' Block the company first.'}
        </p>
        {canDelete && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-60 flex-1">
              <Field label={`Type ${tenant.slug} to confirm`}>
                <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </Field>
            </div>
            <Button
              variant="danger"
              disabled={confirm !== tenant.slug}
              loading={remove.isPending}
              onClick={() => remove.mutate()}
            >
              Delete forever
            </Button>
          </div>
        )}
        <ErrorMessage error={remove.error} />
      </div>
    </section>
  )
}
