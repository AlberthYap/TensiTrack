import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BloodPressureForm } from '@/components/features/records/blood-pressure-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, FileEdit, Sparkles } from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

export const dynamic = 'force-dynamic'

interface EditRecordPageProps {
  params: {
    id: string
  }
}

export default async function EditRecordPage({ params }: EditRecordPageProps) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get the record
  const { data: record, error } = await supabase
    .from('blood_pressure_records')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (error || !record) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Pencatatan', href: '/records' },
          { label: `Detail`, href: `/records/${record.id}` },
          { label: 'Edit' },
        ]}
      />

      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-warm shadow-glow">
            <Sparkles className="w-4 h-4 text-white" />
          </span>
          <span className="text-xs font-semibold tracking-wider text-orange-600 dark:text-orange-400 uppercase">
            Edit Pencatatan
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gradient-warm">
          Edit Data Tekanan Darah
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Perbarui data pencatatan tekanan darah Anda
        </p>
      </div>

      <Card className="overflow-hidden animate-fade-in-up">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20">
          <CardTitle className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-warm shadow-md">
              <Edit className="w-4 h-4 text-white" />
            </span>
            <span>
              Form Edit Data
              <span className="block text-xs font-normal text-gray-500 dark:text-gray-400 mt-0.5">
                Perbarui nilai tekanan darah di bawah ini
              </span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <BloodPressureForm
            record={record}
            redirectPath={`/records/${record.id}`}
          />
        </CardContent>
      </Card>
    </div>
  )
}
