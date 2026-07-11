import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, RefreshCw, WifiOff } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-static'

/**
 * Offline fallback — ditampilkan oleh service worker ketika user
 * mencoba navigasi tanpa koneksi dan tidak ada cached HTML untuk
 * route tersebut. Tidak boleh bergantung pada data user atau server.
 */
export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              <WifiOff className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <CardTitle className="text-lg">Tidak ada koneksi</CardTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Mode offline
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            Anda sedang tidak terhubung ke internet. Halaman ini tidak tersedia
            secara offline. Buka halaman yang pernah dikunjungi sebelumnya,
            atau periksa koneksi Anda dan coba lagi.
          </p>

          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
              Data pencatatan Anda tetap aman di server — tidak ada yang hilang.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
              Setelah online kembali, muat ulang untuk melihat data terbaru.
            </li>
          </ul>

          <div className="flex gap-2 flex-wrap">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex-1 min-w-[120px]"
            >
              <Link href="/" className="inline-flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                Coba lagi
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="flex-1 min-w-[120px] bg-blue-600 hover:bg-blue-700"
            >
              <Link href="/dashboard">
                <Activity className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
