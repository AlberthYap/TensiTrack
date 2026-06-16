'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const updateProfileSchema = z.object({
  full_name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  date_of_birth: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => !val || val === '' || !isNaN(Date.parse(val)),
      'Tanggal lahir tidak valid'
    ),
})

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Password saat ini harus diisi'),
    newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
    confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Password baru dan konfirmasi tidak cocok',
    path: ['confirmPassword'],
  })

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const dobValue = formData.get('date_of_birth')
  const dobStr =
    typeof dobValue === 'string' && dobValue.trim() !== '' ? dobValue : null

  const validatedFields = updateProfileSchema.safeParse({
    full_name: formData.get('full_name'),
    date_of_birth: dobStr,
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message }
  }

  const { full_name, date_of_birth } = validatedFields.data

  // Update profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name,
      date_of_birth: date_of_birth || null,
    })
    .eq('id', user.id)

  if (profileError) {
    return { error: profileError.message }
  }

  // Also update user_metadata for consistency (e.g. header greeting)
  const { error: metaError } = await supabase.auth.updateUser({
    data: { full_name },
  })

  if (metaError) {
    // Non-fatal: metadata update is best-effort
    console.warn('Failed to update user metadata:', metaError)
  }

  revalidatePath('/', 'layout')
  return { success: 'Profil berhasil diperbarui' }
}

export async function changePassword(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return { error: 'Unauthorized' }
  }

  const validatedFields = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message }
  }

  const { currentPassword, newPassword } = validatedFields.data

  // Verify current password by re-authenticating
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (signInError) {
    return { error: 'Password saat ini salah' }
  }

  // Update password
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Password berhasil diubah' }
}

export async function deleteAccount(confirmation: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  if (confirmation !== 'HAPUS AKUN') {
    return { error: 'Konfirmasi tidak valid. Ketik "HAPUS AKUN" untuk melanjutkan.' }
  }

  // Use admin client to delete user (cascade will clean up profiles and records
  // via ON DELETE CASCADE foreign keys)
  try {
    const adminClient = createAdminClient()
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      user.id
    )

    if (deleteError) {
      return { error: deleteError.message }
    }
  } catch (err) {
    // Fallback: if admin client not available, sign out and let user know
    console.error('Admin client delete failed:', err)
    await supabase.auth.signOut()
    return {
      error:
        'Akun tidak dapat dihapus dari sisi server. Hubungi admin untuk menghapus data. Anda telah di-logout.',
    }
  }

  // Sign out current session
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/?deleted=1')
}
