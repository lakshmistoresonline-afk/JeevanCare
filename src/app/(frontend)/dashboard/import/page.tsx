import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageTitle } from '@/components/primitives'
import ImportView from '@/components/admin/ImportView'
import { isSuperAdmin } from '@/access'

export const dynamic = 'force-dynamic'

export default async function DashboardImportPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'owner' && !isSuperAdmin(user)) {
    redirect('/dashboard')
  }

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      <PageTitle subtitle="Upload CSV files or populate medicine catalogs">Bulk Data Import</PageTitle>
      <div className="mt-6">
        <ImportView />
      </div>
    </div>
  )
}
