import Link from 'next/link'
import { Activity } from 'lucide-react'
import { RegisterForm } from '@/components/features/auth/register-form'

export default function RegisterPage() {
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
          <h1 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
            Buat Akun Baru
          </h1>
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
