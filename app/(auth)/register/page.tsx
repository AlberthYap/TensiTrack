import Link from 'next/link'
import { Lock, ShieldAlert, UserPlus } from 'lucide-react'
import { RegisterForm } from '@/components/features/auth/register-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface RegisterPageProps {
  searchParams: {
    token?: string
  }
}

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  // Token akses untuk registrasi - WAJIB di-set di environment variable.
  // Jika tidak di-set, registrasi NON-AKTIF untuk mencegah akses publik
  // tanpa sengaja.
  const REGISTER_TOKEN = process.env.REGISTER_ACCESS_TOKEN

  // Tanpa token env, atau token tidak cocok, tolak akses.
  const isAuthorized =
    typeof REGISTER_TOKEN === 'string' &&
    REGISTER_TOKEN.length > 0 &&
    searchParams.token === REGISTER_TOKEN

  // Jika tidak ada token atau token salah, tampilkan halaman akses ditolak
  if (!isAuthorized) {
    return (
      <div className="space-y-6">
        <div className="text-center animate-fade-in-up">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 mb-4">
            <ShieldAlert className="w-6 h-6 text-white" />
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-2">
            Akses Ditolak
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Halaman registrasi ini tidak dapat diakses secara publik
          </p>
        </div>

        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 dark:border-gray-700/50 p-6 sm:p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                ℹ️ Aplikasi untuk penggunaan pribadi/terbatas
              </p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
                Jika Anda memerlukan akses, hubungi administrator.
              </p>
            </div>

            <Link href="/login">
              <Button className="w-full bg-blue-600 hover:shadow-md">
                Kembali ke Login
              </Button>
            </Link>
          </div>

          {/* Info untuk admin */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <strong>Untuk Admin:</strong> Akses registrasi dengan URL:
            </p>
            <code className="block mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-xs text-blue-600 dark:text-blue-400 font-mono break-all">
              /register?token=YOUR_TOKEN
            </code>
          </div>
        </div>
      </div>
    )
  }

  // Jika token valid, tampilkan form registrasi
  return (
    <div className="space-y-6">
      <div className="text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 mb-4">
          <UserPlus className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">
          Buat Akun Baru
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Mulai pantau tekanan darah Anda hari ini
        </p>
      </div>

      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 dark:border-gray-700/50 p-6 sm:p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <RegisterForm />

        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sudah punya akun?{' '}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-semibold dark:text-blue-400 transition-colors"
            >
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
