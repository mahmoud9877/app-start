import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
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
import { tenantApi } from '../lib/api'
import type { Paginated, User } from '../lib/types'
import { tenantKeys, useMe } from './queries'

const PAGE_SIZE = 20

export function UsersPage() {
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<User | 'new' | null>(null)
  const me = useMe()
  const users = useQuery({
    queryKey: tenantKeys.users(page),
    queryFn: () =>
      tenantApi.get<Paginated<User>>(`/users?page=${page}&limit=${PAGE_SIZE}`),
  })
  const pages = users.data ? Math.max(1, Math.ceil(users.data.total / PAGE_SIZE)) : 1

  return (
    <>
      <PageHeader
        title="Users"
        description="People in your company who can sign in."
        actions={editing === null && <Button onClick={() => setEditing('new')}>Add user</Button>}
      />
      <div className="space-y-6">
        {editing !== null && (
          <UserForm
            key={editing === 'new' ? 'new' : editing.id}
            user={editing === 'new' ? undefined : editing}
            onDone={() => setEditing(null)}
          />
        )}
        <Card>
          {users.isPending ? (
            <Spinner />
          ) : users.error ? (
            <ErrorMessage error={users.error} />
          ) : (
            <Table
              head={['Name', 'Email', 'Status', 'Added', '']}
              empty={users.data.data.length === 0}
            >
              {users.data.data.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  isMe={u.id === me.data?.id}
                  onEdit={() => setEditing(u)}
                />
              ))}
            </Table>
          )}
        </Card>
        {pages > 1 && (
          <div className="flex items-center justify-end gap-2 text-sm">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-slate-500">
              Page {page} of {pages}
            </span>
            <Button variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

function UserRow({
  user,
  isMe,
  onEdit,
}: {
  user: User
  isMe: boolean
  onEdit: () => void
}) {
  const queryClient = useQueryClient()
  const remove = useMutation({
    mutationFn: () => tenantApi.delete(`/users/${user.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tenantKeys.allUsers }),
  })

  return (
    <tr>
      <Td className="font-medium">
        {user.name} {isMe && <span className="text-xs text-slate-400">(you)</span>}
      </Td>
      <Td>{user.email}</Td>
      <Td>
        {user.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="slate">Disabled</Badge>}
      </Td>
      <Td>{formatDate(user.createdAt)}</Td>
      <Td className="text-right whitespace-nowrap">
        <Button variant="ghost" onClick={onEdit}>
          Edit
        </Button>
        {!isMe && (
          <Button
            variant="ghost"
            className="text-red-600"
            loading={remove.isPending}
            onClick={() => {
              if (confirm(`Delete ${user.name}? They will no longer be able to sign in.`)) {
                remove.mutate()
              }
            }}
          >
            Delete
          </Button>
        )}
        <ErrorMessage error={remove.error} />
      </Td>
    </tr>
  )
}

function UserForm({ user, onDone }: { user?: User; onDone: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [isActive, setIsActive] = useState(user?.isActive ?? true)

  const save = useMutation({
    mutationFn: () =>
      user
        ? tenantApi.patch<User>(`/users/${user.id}`, {
            name,
            email,
            isActive,
            // Blank keeps the current password.
            password: password || undefined,
          })
        : tenantApi.post<User>('/users', { name, email, password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.allUsers })
      queryClient.invalidateQueries({ queryKey: tenantKeys.me })
      onDone()
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save.mutate()
  }

  return (
    <Card title={user ? `Edit ${user.name}` : 'Add user'}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field
          label={user ? 'New password' : 'Password'}
          hint={user ? 'Leave blank to keep the current password.' : 'At least 8 characters.'}
        >
          <Input
            type="password"
            autoComplete="new-password"
            required={!user}
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {user && (
          <label className="flex items-center gap-2 self-center text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Can sign in
          </label>
        )}
        <div className="space-y-3 sm:col-span-2">
          <ErrorMessage error={save.error} />
          <div className="flex gap-2">
            <Button type="submit" loading={save.isPending}>
              {user ? 'Save' : 'Add user'}
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
