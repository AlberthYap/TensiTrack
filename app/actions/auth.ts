'use server'

import { timingSafeEqual } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validations'
import { checkAuthRateLimit, getClientIp } from '@/lib/rate-limit'
import { DEMO_EMAIL, DEMO_PASSWORD, isDemoEmail } from '@/lib/demo'

// Anti-abuse limits for auth endpoints.
const LOGIN_MAX = 5
const LOGIN_WINDOW_SECONDS = 15 * 60
const REGISTER_MAX = 3
const REGISTER_WINDOW_SECONDS = 60 * 60
const FORGOT_PASSWORD_MAX = 3
const FORGOT_PASSWORD_WINDOW_SECONDS = 60 * 60

// Generic lockout banner — prevent user enumeration.
const LOCKOUT_MESSAGE = 'Terlalu banyak permintaan. Coba lagi nanti.'

export async function register(
  formData: FormData,
  accessToken: string
) {
  const supabase = await createClient()

  // Server-side gate: REGISTER_ACCESS_TOKEN must match (constant-time via timingSafeEqual).
  const expected = process.env.REGISTER_ACCESS_TOKEN
  if (
    !expected ||
    expected.length === 0 ||
    typeof accessToken !== 'string' ||
    accessToken.length !== expected.length ||
    !timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(accessToken, 'utf8')
    )
  ) {
    return { error: 'Akses ditolak. Token registrasi tidak valid.' }
  }

  const ip = await getClientIp()
  const { allowed } = await checkAuthRateLimit(
    `register:ip:${ip}`,
    REGISTER_MAX,
    REGISTER_WINDOW_SECONDS
  )
  if (!allowed) {
    return { error: LOCKOUT_MESSAGE }
  }

  const validatedFields = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    full_name: formData.get('full_name'),
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
    }
  }

  const { email, password, full_name } = validatedFields.data

  // Demo email is reserved for the shared demo account.
  if (isDemoEmail(email)) {
    return { error: 'Email demo tidak dapat digunakan untuk registrasi.' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
      },
    },
  })

  if (error) {
    return {
      error: error.message,
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  // Per-key composite {ip}+{email} to prevent IP rotation bypass.
  const fd = formData
  const emailRaw = fd.get('email')
  const ip = await getClientIp()
  if (typeof emailRaw === 'string' && emailRaw.length > 0) {
    const { allowed } = await checkAuthRateLimit(
      `login:ip:email:${ip}:${emailRaw.toLowerCase()}`,
      LOGIN_MAX,
      LOGIN_WINDOW_SECONDS
    )
    if (!allowed) {
      return { error: LOCKOUT_MESSAGE }
    }
  }

  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
    }
  }

  const { email, password } = validatedFields.data

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error:', error)

    if (error.message.includes('Email not confirmed')) {
      return {
        error: 'Email belum diverifikasi. Cek inbox email Anda atau hubungi admin.',
      }
    }
    
    if (error.message.includes('Invalid login credentials')) {
      return {
        error: 'Email atau password salah. Pastikan email sudah terdaftar dan password benar.',
      }
    }

    return {
      error: error.message || 'Gagal login. Silakan coba lagi.',
    }
  }

  // Clean up demo data older than 24 hours, then seed sample data
  // if the account is empty (gives the first visitor a populated dashboard).
  if (isDemoEmail(email)) {
    try {
      await supabase.rpc('cleanup_demo_data')
    } catch (cleanupError) {
      console.error('Demo cleanup error:', cleanupError)
    }

    try {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const adminClient = createAdminClient()
        await adminClient.rpc('seed_demo_sample_data')
      }
    } catch (seedError) {
      console.error('Demo sample data seed error:', seedError)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

/**
 * Direct login as the shared demo account.
 * Credentials are server-side only — never exposed to the client.
 */
export async function loginAsDemo(): Promise<{ error?: string } | void> {
  const fd = new FormData()
  fd.set('email', DEMO_EMAIL)
  fd.set('password', DEMO_PASSWORD)
  return await login(fd)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()

  // Per-email — prevent inbox bombing.
  const emailRaw = formData.get('email')

  // Demo account password is fixed; reset is not allowed.
  if (typeof emailRaw === 'string' && isDemoEmail(emailRaw)) {
    return {
      error: 'Akun demo tidak dapat mereset password. Silakan login sebagai demo.',
    }
  }

  if (typeof emailRaw === 'string' && emailRaw.length > 0) {
    const { allowed } = await checkAuthRateLimit(
      `forgot:email:${emailRaw.toLowerCase()}`,
      FORGOT_PASSWORD_MAX,
      FORGOT_PASSWORD_WINDOW_SECONDS
    )
    if (!allowed) {
      // Generic response identical to success — don't leak rate-limit vs unregistered email.
      return {
        success:
          'Jika email terdaftar, link reset password telah dikirim. Cek inbox Anda.',
      }
    }
  }

  const validatedFields = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message }
  }

  const { email } = validatedFields.data

  // Only NEXT_PUBLIC_APP_URL — do NOT use Host header (host header injection).
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    console.error('forgotPassword: NEXT_PUBLIC_APP_URL not configured')
    return {
      error:
        'Layanan reset password tidak tersedia. Silakan hubungi admin.',
    }
  }
  const redirectTo = `${appUrl.replace(/\/+$/, '')}/reset-password`

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) {
    console.error('Forgot password error:', error)
    return {
      success:
        'Jika email terdaftar, link reset password telah dikirim. Cek inbox Anda.',
    }
  }

  return {
    success:
      'Jika email terdaftar, link reset password telah dikirim. Cek inbox Anda.',
  }
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()

  const validatedFields = resetPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message }
  }

  const { password } = validatedFields.data

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error:
        'Sesi reset tidak valid atau sudah kadaluarsa. Minta link reset baru.',
    }
  }

  // Demo account password is fixed; reset is not allowed.
  if (user.email && isDemoEmail(user.email)) {
    return {
      error: 'Akun demo tidak dapat mereset password. Silakan login sebagai demo.',
    }
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    console.error('Reset password error:', error)
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/login?reset=success')
}
