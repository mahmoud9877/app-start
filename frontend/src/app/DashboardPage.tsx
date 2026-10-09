import { Link } from 'react-router'
import { PageHeader } from '../components/Shell'
import { Badge, formatDate } from '../components/ui'
import { useCompany, useMe } from './queries'

export function DashboardPage() {
  const company = useCompany()
  const me = useMe()
  if (!company.data) return null

  return (
    <>
      <PageHeader
        title={`Welcome${me.data ? `, ${me.data.name}` : ''}`}
        description={company.data.name}
      />
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Your modules
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {company.data.modules.map((m) => {
          const expired = !m.active && m.expiresAt !== null
          const body = (
            <>
              <div className="flex items-center justify-between">
                <span className="font-medium">{m.name}</span>
                {m.active ? (
                  <Badge tone="green">Active</Badge>
                ) : expired ? (
                  <Badge tone="red">Expired</Badge>
                ) : (
                  <Badge tone="slate">Not subscribed</Badge>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {m.active
                  ? m.expiresAt
                    ? `Paid until ${formatDate(m.expiresAt)}`
                    : 'No expiry'
                  : expired
                    ? `Expired ${formatDate(m.expiresAt)}. Contact us to renew.`
                    : 'Contact us to add this module.'}
              </p>
            </>
          )
          const className =
            'block rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200'
          return m.active ? (
            <Link key={m.key} to={`/m/${m.key}`} className={`${className} hover:ring-indigo-300`}>
              {body}
            </Link>
          ) : (
            <div key={m.key} className={`${className} opacity-70`}>
              {body}
            </div>
          )
        })}
      </div>
    </>
  )
}
