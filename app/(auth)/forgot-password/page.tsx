import Link from 'next/link'
import { ArrowLeft, KeyRound, Mail } from 'lucide-react'
import { ForgotPasswordForm } from '@/components/features/auth/forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600 mb-4">
          <KeyRound className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">
          Lupa Password?
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Masukkan email Anda dan kami akan kirimkan link untuk reset password
        </p>
      </div>

      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 dark:border-gray-700/50 p-6 sm:p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <ForgotPasswordForm />

        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 space-y-3 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ingat password Anda?{' '}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
            >
              Kembali ke login
            </Link>
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
