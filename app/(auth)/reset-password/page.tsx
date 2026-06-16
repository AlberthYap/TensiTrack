import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Activity } from 'lucide-react'
import { ResetPasswordForm } from '@/components/features/auth/reset-password-form'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
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
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-red-600 dark:text-red-400">
                Link Tidak Valid
              </CardTitle>
              <CardDescription className="text-center">
                {searchParams.error_description ||
                  'Link reset password tidak valid atau sudah kadaluarsa.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/forgot-password">
                <Button className="w-full">Minta Link Baru</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!user) {
    // No active session - user needs to come from email link
    redirect('/forgot-password')
  }

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

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
            <CardDescription className="text-center">
              Masukkan password baru untuk akun Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResetPasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
