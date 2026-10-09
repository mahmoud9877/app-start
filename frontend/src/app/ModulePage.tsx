import { Navigate, useParams } from 'react-router'
import { PageHeader } from '../components/Shell'
import { Card } from '../components/ui'
import { useCompany } from './queries'

// Placeholder for paid modules until their screens are built. Replace the
// /m/:key route with a real page per module (e.g. /m/inventory → InventoryPage).
export function ModulePage() {
  const { key } = useParams()
  const company = useCompany()
  const module = company.data?.modules.find((m) => m.key === key)

  // Typed the URL for a module the company hasn't paid for.
  if (company.data && !module?.active) return <Navigate to="/" replace />
  if (!module) return null

  return (
    <>
      <PageHeader title={module.name} />
      <Card>
        <p className="text-sm text-slate-600">
          The {module.name} module is enabled for your company. Its screens
          haven't been built yet.
        </p>
      </Card>
    </>
  )
}
