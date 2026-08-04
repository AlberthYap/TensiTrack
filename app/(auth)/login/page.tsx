import { CheckCircle2, LogIn, Shield } from 'lucide-react'
import { LoginForm } from '@/components/features/auth/login-form'

interface LoginPageProps {
  searchParams: {
    reset?: string
  }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const showResetSuccess = searchParams.reset === 'success'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4">
          <LogIn className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">
          Selamat Datang Kembali
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Masuk untuk melanjutkan pencatatan tekanan darah Anda
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 dark:border-gray-700/50 p-6 sm:p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {showResetSuccess && (
          <div className="mb-6 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Password berhasil direset
              </p>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                Silakan masuk dengan password baru Anda.
              </p>
            </div>
          </div>
        )}

        <LoginForm />

        {/* Security note */}
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Shield className="w-3.5 h-3.5 text-blue-500" />
          <span>Koneksi Anda aman dan terenkripsi</span>
        </div>
      </div>
    </div>
  )
}
