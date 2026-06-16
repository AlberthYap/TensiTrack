import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Sparkles, Upload } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RecordsList } from '@/components/features/records/records-list'
import { ShareDialog } from '@/components/features/records/share-dialog'
import { CsvImportDialog } from '@/components/features/records/csv-import-dialog'
import { getBloodPressureRecordsPaginated } from '@/app/actions/blood-pressure'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

export const dynamic = 'force-dynamic'

interface RecordsPageProps {
  searchParams: {
    page?: string
    pageSize?: string
    startDate?: string
    endDate?: string
  }
}

export default async function RecordsPage({ searchParams }: RecordsPageProps) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const page = Math.max(1, Number(searchParams.page) || 1)
  const pageSize = Math.max(1, Math.min(100, Number(searchParams.pageSize) || 10))
  const startDate = searchParams.startDate || ''
  const endDate = searchParams.endDate || ''

  // Server-side paginated fetch with optional date filter
  const { data: result, error } = await getBloodPressureRecordsPaginated({
    page,
    pageSize,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  const recordsList = result?.data ?? []
  const total = result?.total ?? 0
  const totalPages = result?.totalPages ?? 1

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Pencatatan' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-hero shadow-glow">
              <Sparkles className="w-4 h-4 text-white" />
            </span>
            <span className="text-xs font-semibold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
              Riwayat Lengkap
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Semua Pencatatan
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {total > 0
              ? `${total} total pencatatan tekanan darah`
              : 'Belum ada data tekanan darah'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <CsvImportDialog />
          <ShareDialog />
          <Link href="/records/new">
            <button className="whitespace-nowrap inline-flex items-center justify-center rounded-md text-sm font-medium transition-all h-10 px-4 py-2 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0">
              <FileText className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Tambah Data</span>
              <span className="sm:hidden">Tambah</span>
            </button>
          </Link>
        </div>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 dark:text-red-400">
              Gagal memuat data: {error}
            </p>
          </CardContent>
        </Card>
      ) : (
        <RecordsList
          records={recordsList}
          total={total}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          startDate={startDate}
          endDate={endDate}
          basePath="/records"
        />
      )}
    </div>
  )
}
