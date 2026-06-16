import Link from 'next/link'
import { Activity, CheckCircle2 } from 'lucide-react'
import { LoginForm } from '@/components/features/auth/login-form'

interface LoginPageProps {
  searchParams: {
    reset?: string
  }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const showResetSuccess = searchParams.reset === 'success'

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

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
            Masuk ke Akun Anda
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Pantau tekanan darah Anda dengan mudah
          </p>

          {showResetSuccess && (
            <div className="mb-6 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-600 dark:text-green-400">
                Password berhasil direset. Silakan masuk dengan password baru Anda.
              </p>
            </div>
          )}

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
