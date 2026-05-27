import { notFound } from 'next/navigation'
import { getRecordsByShareToken } from '@/app/actions/share'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Lock, Eye } from 'lucide-react'
import { RecordsList } from '@/components/features/records/records-list'

interface SharePageProps {
  params: {
    token: string
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const { data: records, error } = await getRecordsByShareToken(params.token)

  if (error || !records) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="bg-blue-600 p-4 rounded-2xl">
                <Activity className="w-12 h-12 text-white" />
              </div>
            </div>

            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-red-100 dark:bg-red-950 p-4 rounded-full">
                    <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <CardTitle className="text-center text-red-600 dark:text-red-400">
                  Link Tidak Valid
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  {error || 'Link share ini tidak valid, sudah kadaluarsa, atau telah mencapai batas maksimal views.'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Silakan hubungi pemilik data untuk mendapatkan link baru.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="bg-blue-600 p-3 rounded-xl">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Tensi Harian
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Tampilan Berbagi (Read-Only)
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <Card className="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="py-4">
              <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                <Lock className="w-4 h-4 inline mr-2" />
                Anda melihat data yang dibagikan. Data ini hanya untuk dibaca dan tidak dapat diubah.
              </p>
            </CardContent>
          </Card>

          {/* Records */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Riwayat Pencatatan
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Total {records.length} pencatatan
                </p>
              </div>
            </div>

            <RecordsList records={records} readOnly={true} />
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Powered by <span className="font-semibold">Tensi Harian</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
