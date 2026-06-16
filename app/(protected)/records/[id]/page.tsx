import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Activity, ArrowLeft, Calendar, Clock, Edit, FileText, Heart, MessageSquare, Trash2, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getBloodPressureRecord } from '@/app/actions/blood-pressure'
import { calculateCategory, getCategoryInfo } from '@/lib/blood-pressure'
import { formatDateTime, formatRelativeTime } from '@/lib/date'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryBadge } from '@/components/ui/category-badge'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { DeleteRecordDialog } from '@/components/features/records/delete-record-dialog'

export const dynamic = 'force-dynamic'

interface RecordDetailPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: RecordDetailPageProps) {
  return {
    title: `Detail Pencatatan #${params.id.slice(0, 8)} - Tensi Harian`,
    description: 'Detail pencatatan tekanan darah Anda',
  }
}

export default async function RecordDetailPage({ params }: RecordDetailPageProps) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: record, error } = await getBloodPressureRecord(params.id)

  if (error || !record) {
    notFound()
  }

  const categoryInfo = getCategoryInfo(record.category)
  const category = calculateCategory(record.systolic, record.diastolic)
  const pulsePressure = record.systolic - record.diastolic
  const map = record.diastolic + (pulsePressure / 3) // Mean Arterial Pressure

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Pencatatan', href: '/records' },
          { label: `Detail #${record.id.slice(0, 8)}` },
        ]}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <Link
            href="/records"
            className="mt-1 p-2 rounded-lg hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors"
            aria-label="Kembali ke daftar"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600">
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </span>
              <span className="text-xs font-semibold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
                Detail Pencatatan
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Tekanan Darah
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              {formatRelativeTime(record.measured_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/records/${record.id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <DeleteRecordDialog
            recordId={record.id}
            recordLabel={`${record.systolic}/${record.diastolic} mmHg`}
            redirectAfterDelete
          />
        </div>
      </div>

      {/* Hero BP Reading Card */}
      <Card className="overflow-hidden relative animate-fade-in-up">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 pointer-events-none" />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl pointer-events-none" />
        <CardContent className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Pembacaan Tekanan Darah</p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-5xl sm:text-6xl font-bold text-gradient">
                  {record.systolic}
                </span>
                <span className="text-3xl sm:text-4xl text-gray-400 font-light">/</span>
                <span className="text-5xl sm:text-6xl font-bold text-gradient-cool">
                  {record.diastolic}
                </span>
                <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">mmHg</span>
              </div>
              <div className="mt-3">
                <CategoryBadge category={record.category} size="lg" />
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2">
              <div className="text-xs text-gray-500 dark:text-gray-400">ID Pencatatan</div>
              <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {record.id}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Measured At */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-cool">
                <Calendar className="w-4 h-4 text-white" />
              </span>
              Waktu Pengukuran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatDateTime(record.measured_at)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {formatRelativeTime(record.measured_at)}
            </p>
          </CardContent>
        </Card>

        {/* Pulse */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-warm">
                <Heart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </span>
              Denyut Nadi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {record.pulse ? (
              <>
                <p className="text-3xl font-bold text-gradient-warm">
                  {record.pulse}
                  <span className="text-base text-gray-500 dark:text-gray-400 font-normal ml-1">bpm</span>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {record.pulse < 60 ? 'Lebih rendah dari rata-rata' :
                   record.pulse > 100 ? 'Lebih tinggi dari rata-rata' :
                   'Dalam rentang normal'}
                </p>
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">Tidak dicatat</p>
            )}
          </CardContent>
        </Card>

        {/* Pulse Pressure */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-success">
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </span>
              Tekanan Nadi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gradient-success">
              {pulsePressure}
              <span className="text-base text-gray-500 dark:text-gray-400 font-normal ml-1">mmHg</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Selisih sistolik dan diastolik
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Normal: 30-50 mmHg
            </p>
          </CardContent>
        </Card>

        {/* MAP */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-violet-600">
                <FileText className="w-4 h-4 text-white" />
              </span>
              Tekanan Arteri Rata-rata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gradient-cool">
              {Math.round(map)}
              <span className="text-base text-gray-500 dark:text-gray-400 font-normal ml-1">mmHg</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Indikator perfusi organ
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Normal: 70-100 mmHg
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Info */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CategoryBadge category={record.category} />
            <span className="text-lg">Informasi Kategori</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-xl ${categoryInfo.bgColor} border ${categoryInfo.borderColor}`}>
            <h3 className={`font-semibold ${categoryInfo.textColor}`}>
              {categoryInfo.label}
            </h3>
            <p className={`text-sm mt-1 ${categoryInfo.descriptionColor}`}>
              {categoryInfo.description}
            </p>
            {categoryInfo.recommendation && (
              <div className="mt-3 pt-3 border-t border-current/10">
                <p className={`text-sm font-medium ${categoryInfo.textColor}`}>
                  💡 Rekomendasi:
                </p>
                <p className={`text-sm mt-1 ${categoryInfo.descriptionColor}`}>
                  {categoryInfo.recommendation}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-pink-600">
              <MessageSquare className="w-4 h-4 text-white" />
            </span>
            Catatan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {record.notes ? (
            <blockquote className="border-l-4 border-blue-400 pl-4 py-2 italic text-gray-700 dark:text-gray-300 bg-blue-50/50 dark:bg-blue-950/20 rounded-r-lg">
              {record.notes}
            </blockquote>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">Tidak ada catatan</p>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-warning">
              <User className="w-4 h-4 text-white" />
            </span>
            Metadata
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Dibuat pada</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatDateTime(record.created_at)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Diperbarui pada</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatDateTime(record.updated_at)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Kategori (saat itu)</dt>
              <dd>
                <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {category}
                </code>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Status</dt>
              <dd>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Aktif
                </span>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Footer Actions (Mobile) */}
      <div className="md:hidden flex gap-2">
        <Link href="/records" className="flex-1">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <Link href={`/records/${record.id}/edit`} className="flex-1">
          <Button className="w-full">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>
    </div>
  )
}
