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
    return { error: validatedFields.error.issues[0].message }
  }

  const { full_name, date_of_birth } = validatedFields.data

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

  const validatedFields = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0].message }
  }

  const { currentPassword, newPassword } = validatedFields.data

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
    return { error: error.message }
  }

  return { success: 'Password berhasil diubah' }
}

/**
 * Hapus akun: wajib re-auth password untuk mencegah session-hijack abuse.
 * BUG #15: jika admin delete gagal, JANGAN signOut — user harus tetap
 * punya akses untuk coba lagi / hubungi admin.
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
      return { error: deleteError.message }
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
