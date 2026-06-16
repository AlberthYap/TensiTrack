import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Lock, ShieldX } from 'lucide-react'
import { ResetPasswordForm } from '@/components/features/auth/reset-password-form'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

interface ResetPasswordPageProps {
  searchParams: {
    error?: string
    error_description?: string
  }
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  // When user comes from email link, Supabase will redirect with a code in URL
  // and the session will be set automatically.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If there's an error from Supabase (invalid/expired link), show error UI
  if (searchParams.error) {
    return (
      <div className="space-y-6">
        <div className="text-center animate-fade-in-up">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-glow mb-4">
            <ShieldX className="w-6 h-6 text-white" />
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-2">
            Link Tidak Valid
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {searchParams.error_description ||
              'Link reset password tidak valid atau sudah kadaluarsa.'}
          </p>
        </div>

        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 dark:border-gray-700/50 p-6 sm:p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Link href="/forgot-password">
            <Button className="w-full bg-gradient-hero hover:shadow-glow">
              Minta Link Baru
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!user) {
    // No active session - user needs to come from email link
    redirect('/forgot-password')
  }

  return (
    <div className="space-y-6">
      <div className="text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-warm shadow-glow mb-4">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gradient-warm mb-2">
          Reset Password
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Masukkan password baru untuk akun Anda
        </p>
      </div>

      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 dark:border-gray-700/50 p-6 sm:p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <ResetPasswordForm />
      </div>
    </div>
  )
}
