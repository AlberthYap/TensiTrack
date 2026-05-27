import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RecordsList } from '@/components/features/records/records-list'
import { ShareDialog } from '@/components/features/records/share-dialog'

export default async function RecordsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get all records
  const { data: records, error } = await supabase
    .from('blood_pressure_records')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('measured_at', { ascending: false })

  const recordsList = records || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Riwayat Pencatatan
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Semua data tekanan darah Anda
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ShareDialog />
          <Link href="/records/new">
            <Button className="whitespace-nowrap">
              <FileText className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Tambah Data</span>
              <span className="sm:hidden">Tambah</span>
            </Button>
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
              Gagal memuat data: {error.message}
            </p>
          </CardContent>
        </Card>
      ) : (
        <RecordsList records={recordsList} />
      )}
    </div>
  )
}
