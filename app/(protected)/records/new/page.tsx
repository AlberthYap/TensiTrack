import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BloodPressureForm } from '@/components/features/records/blood-pressure-form'

export default function NewRecordPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tambah Data Baru
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Catat tekanan darah Anda
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Pencatatan</CardTitle>
        </CardHeader>
        <CardContent>
          <BloodPressureForm />
        </CardContent>
      </Card>
    </div>
  )
}
