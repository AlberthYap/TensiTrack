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
import { Lock, Settings as SettingsIcon, Trash2, User } from 'lucide-react'

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Pengaturan
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Kelola profil, keamanan, dan preferensi akun Anda
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profil
          </CardTitle>
          <CardDescription>
            Informasi dasar tentang Anda. Digunakan untuk personalisasi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm initialData={initialData} />
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Keamanan
          </CardTitle>
          <CardDescription>
            Ubah password Anda secara berkala untuk menjaga keamanan akun.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Trash2 className="w-5 h-5" />
            Zona Berbahaya
          </CardTitle>
          <CardDescription>
            Tindakan di bawah ini permanen dan tidak dapat dibatalkan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 p-4 border border-red-200 dark:border-red-800 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Hapus Akun
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Semua data, catatan, dan link share akan dihapus permanen.
              </p>
            </div>
            <DeleteAccountDialog />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
