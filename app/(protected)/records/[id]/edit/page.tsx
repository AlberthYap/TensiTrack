import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BloodPressureForm } from '@/components/features/records/blood-pressure-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/records">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Pencatatan
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Ubah data tekanan darah Anda
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Edit Data</CardTitle>
        </CardHeader>
        <CardContent>
          <BloodPressureForm record={record} />
        </CardContent>
      </Card>
    </div>
  )
}
