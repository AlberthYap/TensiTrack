import Link from 'next/link'
import { Activity, Lock } from 'lucide-react'
import { RegisterForm } from '@/components/features/auth/register-form'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface RegisterPageProps {
  searchParams: {
    token?: string
  }
}

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  // Token akses untuk registrasi - ganti dengan token rahasia Anda
  // Untuk keamanan lebih baik, simpan di environment variable
  const REGISTER_TOKEN = process.env.REGISTER_ACCESS_TOKEN || 'tensi-admin-2026'
  
  // Cek apakah token valid
  const isAuthorized = searchParams.token === REGISTER_TOKEN

  // Jika tidak ada token atau token salah, tampilkan halaman akses ditolak
  if (!isAuthorized) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-blue-600 p-3 rounded-xl">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                Tensi Harian
              </span>
            </Link>
          </div>

          {/* Access Denied Card */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="bg-red-100 dark:bg-red-950 p-4 rounded-full">
                  <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <CardTitle className="text-center text-red-600 dark:text-red-400">
                Akses Ditolak
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Halaman registrasi ini hanya dapat diakses dengan token khusus.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Aplikasi ini untuk penggunaan pribadi/terbatas. Jika Anda memerlukan akses, 
                hubungi administrator.
              </p>
              <Link href="/login">
                <Button className="w-full">
                  Kembali ke Login
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Info untuk admin */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              <strong>Untuk Admin:</strong> Akses registrasi dengan URL: 
              <code className="block mt-2 p-2 bg-white dark:bg-gray-900 rounded text-blue-600 dark:text-blue-400">
                /register?token=YOUR_TOKEN
              </code>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Jika token valid, tampilkan form registrasi
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-blue-600 p-3 rounded-xl">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              Tensi Harian
            </span>
          </Link>
        </div>

        {/* Register Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
              Buat Akun Baru
            </h1>
            <div className="bg-green-100 dark:bg-green-950 p-1 rounded">
              <Lock className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Mulai pantau kesehatan Anda hari ini
          </p>

          <RegisterForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sudah punya akun?{' '}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-semibold dark:text-blue-400"
              >
                Masuk
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
