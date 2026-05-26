import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function RecordsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Riwayat Pencatatan
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Semua data tekanan darah Anda
          </p>
        </div>
        <Link href="/records/new">
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Tambah Data
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pencatatan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400">
            Fitur ini sedang dalam pengembangan...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
