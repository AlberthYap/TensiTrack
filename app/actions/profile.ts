'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isDemoEmail } from '@/lib/demo'
import { passwordField } from '@/lib/validations'
import { checkAuthRateLimit } from '@/lib/rate-limit'

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
  target_systolic: z
    .preprocess(
      (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
      z.number().int().min(50).max(250).nullable().optional()
    ),
  target_diastolic: z
    .preprocess(
      (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
      z.number().int().min(30).max(150).nullable().optional()
    ),
})

const PASSWORD_CHANGE_MAX = 5
const PASSWORD_CHANGE_WINDOW_SECONDS = 15 * 60

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Password saat ini harus diisi'),
    newPassword: passwordField,
    confirmPassword: passwordField,
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

  // Demo account profile is shared and must remain fixed.
  if (user.email && isDemoEmail(user.email)) {
    return { error: 'Akun demo tidak dapat mengubah profil.' }
  }

  const dobValue = formData.get('date_of_birth')
  const dobStr =
    typeof dobValue === 'string' && dobValue.trim() !== '' ? dobValue : null

  const validatedFields = updateProfileSchema.safeParse({
    full_name: formData.get('full_name'),
    date_of_birth: dobStr,
    target_systolic: formData.get('target_systolic'),
    target_diastolic: formData.get('target_diastolic'),
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0].message }
  }

  const { full_name, date_of_birth, target_systolic, target_diastolic } = validatedFields.data

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name,
      date_of_birth: date_of_birth || null,
      target_systolic: target_systolic ?? null,
      target_diastolic: target_diastolic ?? null,
    })
    .eq('id', user.id)

  if (profileError) {
    console.error('updateProfile: database update failed:', profileError)
    return { error: 'Profil tidak dapat diperbarui. Silakan coba lagi nanti.' }
  }

  const { error: metaError } = await supabase.auth.updateUser({
    data: { full_name },
  })

  if (metaError) {
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

  // Demo account password is fixed and cannot be changed.
  if (isDemoEmail(user.email)) {
    return {
      error: 'Akun demo tidak dapat mengubah password.',
    }
  }

  const validatedFields = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0].message }
  }

  const { currentPassword, newPassword } = validatedFields.data

  const { allowed } = await checkAuthRateLimit(
    `password-change:user:${user.id}`,
    PASSWORD_CHANGE_MAX,
    PASSWORD_CHANGE_WINDOW_SECONDS
  )
  if (!allowed) {
    return { error: 'Terlalu banyak percobaan. Coba lagi nanti.' }
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (signInError) {
    return { error: 'Password saat ini salah' }
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    console.error('changePassword: update failed:', error)
    return { error: 'Password tidak dapat diubah. Silakan coba lagi nanti.' }
  }

  return { success: 'Password berhasil diubah' }
}

/**
 * Delete account: re-auth with password required to prevent session-hijack
 * abuse. BUG #15: if admin delete fails, do NOT signOut — user must retain
 * access to try again or contact admin.
 */
export async function deleteAccount(confirmation: string, password: string) {
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

  if (!user.email) {
    return {
      error:
        'Akun tidak memiliki email yang dapat diverifikasi. Hubungi admin.',
    }
  }

  // Demo account is shared and must not be deleted by visitors.
  if (isDemoEmail(user.email)) {
    return {
      error: 'Akun demo tidak dapat dihapus.',
    }
  }

  if (typeof password !== 'string' || password.length === 0) {
    return {
      error: 'Password saat ini wajib diisi untuk konfirmasi penghapusan akun.',
    }
  }

  const { error: reAuthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  })
  if (reAuthError) {
    console.warn('deleteAccount: re-auth failed:', reAuthError)
    return {
      error: 'Password salah atau sesi tidak valid. Coba lagi.',
    }
  }

  try {
    const adminClient = createAdminClient()
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      user.id
    )

    if (deleteError) {
      console.error('deleteAccount: admin delete failed:', deleteError)
      return {
        error: 'Akun tidak dapat dihapus dari sisi server. Hubungi admin untuk menghapus data.',
      }
    }
  } catch (err) {
    console.error('Admin client delete failed:', err)
    return {
      error:
        'Akun tidak dapat dihapus dari sisi server. Hubungi admin untuk menghapus data.',
    }
  }

  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/?deleted=1')
}
