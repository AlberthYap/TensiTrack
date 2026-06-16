import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, PlusCircle, Sparkles } from 'lucide-react'
import { BloodPressureForm } from '@/components/features/records/blood-pressure-form'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

export default function NewRecordPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Pencatatan', href: '/records' },
          { label: 'Tambah Baru' },
        ]}
      />

      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
            <Sparkles className="w-4 h-4 text-white" />
          </span>
          <span className="text-xs font-semibold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
            Pencatatan Baru
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gradient">
          Tambah Data Baru
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Catat tekanan darah Anda untuk memantau kesehatan
        </p>
      </div>

      <Card className="overflow-hidden animate-fade-in-up">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
          <CardTitle className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-success shadow-md">
              <PlusCircle className="w-4 h-4 text-white" />
            </span>
            <span>
              Form Pencatatan
              <span className="block text-xs font-normal text-gray-500 dark:text-gray-400 mt-0.5">
                Isi data tekanan darah dengan lengkap
              </span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <BloodPressureForm redirectPath="/records" />
        </CardContent>
      </Card>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        💡 Tip: Catat tekanan darah di waktu yang sama setiap hari untuk hasil yang lebih akurat
      </p>
    </div>
  )
}
