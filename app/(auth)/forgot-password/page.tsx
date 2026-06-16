import Link from 'next/link'
import { Activity } from 'lucide-react'
import { ForgotPasswordForm } from '@/components/features/auth/forgot-password-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ForgotPasswordPage() {
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

        {/* Forgot Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Lupa Password</CardTitle>
            <CardDescription className="text-center">
              Masukkan email Anda dan kami akan kirimkan link untuk reset
              password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Ingat password Anda?{' '}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Kembali ke login
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:underline">
            ← Kembali ke beranda
          </Link>
        </p>
      </div>
    </div>
  )
}
