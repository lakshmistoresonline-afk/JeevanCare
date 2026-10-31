import { requireDashboardSession } from '@/lib/auth'
import { PageTitle } from '@/components/primitives'
import ImportView from '@/components/admin/ImportView'

export const dynamic = 'force-dynamic'

export default async function DashboardImportPage() {
  await requireDashboardSession()
  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      <PageTitle subtitle="Upload CSV files or populate medicine catalogs">Bulk Data Import</PageTitle>
      <div className="mt-6">
        <ImportView />
      </div>
    </div>
  )
}
