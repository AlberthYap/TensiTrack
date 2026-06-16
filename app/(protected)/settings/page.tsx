import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ProfileForm } from '@/components/features/settings/profile-form'
import { ChangePasswordForm } from '@/components/features/settings/change-password-form'
import { DeleteAccountDialog } from '@/components/features/settings/delete-account-dialog'
import { AlertTriangle, Lock, Settings as SettingsIcon, Sparkles, User } from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, date_of_birth, email')
    .eq('id', user.id)
    .maybeSingle()

  const initialData = {
    full_name:
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'User',
    email: profile?.email || user.email || '',
    date_of_birth: profile?.date_of_birth || null,
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Pengaturan' }]} />

      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-cool shadow-glow">
            <Sparkles className="w-4 h-4 text-white" />
          </span>
          <span className="text-xs font-semibold tracking-wider text-cyan-600 dark:text-cyan-400 uppercase">
            Pengaturan Akun
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gradient">
          Pengaturan
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Kelola profil, keamanan, dan preferensi akun Anda
        </p>
      </div>

      <div className="space-y-6 stagger-children">
        {/* Profile Card */}
        <Card className="overflow-hidden animate-fade-in-up">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardTitle className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-hero shadow-md">
                <User className="w-4 h-4 text-white" />
              </span>
              <span>
                Profil
                <span className="block text-xs font-normal text-gray-500 dark:text-gray-400 mt-0.5">
                  Informasi dasar tentang Anda
                </span>
              </span>
            </CardTitle>
            <CardDescription>
              Digunakan untuk personalisasi dan tampilan aplikasi.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ProfileForm initialData={initialData} />
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card className="overflow-hidden animate-fade-in-up">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
            <CardTitle className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-purple shadow-md">
                <Lock className="w-4 h-4 text-white" />
              </span>
              <span>
                Keamanan
                <span className="block text-xs font-normal text-gray-500 dark:text-gray-400 mt-0.5">
                  Ubah password Anda secara berkala
                </span>
              </span>
            </CardTitle>
            <CardDescription>
              Jaga keamanan akun dengan password yang kuat dan unik.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ChangePasswordForm />
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="overflow-hidden border-red-200 dark:border-red-800 animate-fade-in-up">
          <CardHeader className="border-b border-red-100 dark:border-red-900 bg-gradient-to-r from-red-50/50 to-rose-50/50 dark:from-red-950/30 dark:to-rose-950/30">
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 shadow-md">
                <AlertTriangle className="w-4 h-4 text-white" />
              </span>
              <span>
                Zona Berbahaya
                <span className="block text-xs font-normal text-red-500/80 dark:text-red-400/80 mt-0.5">
                  Tindakan permanen - tidak dapat dibatalkan
                </span>
              </span>
            </CardTitle>
            <CardDescription className="text-red-600/80 dark:text-red-400/80">
              Berhati-hatilah, tindakan di bawah ini akan menghapus akun Anda secara permanen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between gap-4 p-4 border-2 border-red-200 dark:border-red-800 rounded-xl bg-red-50/30 dark:bg-red-950/20 hover:bg-red-50/60 dark:hover:bg-red-950/30 transition-colors">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Hapus Akun
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Semua data, catatan tekanan darah, dan link share akan dihapus permanen.
                </p>
              </div>
              <DeleteAccountDialog />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
