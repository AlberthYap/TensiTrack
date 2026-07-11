'use server'

import { timingSafeEqual } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validations'
import { checkAuthRateLimit, getClientIp } from '@/lib/rate-limit'

// Anti-abuse limits untuk endpoint auth.
const LOGIN_MAX = 5
const LOGIN_WINDOW_SECONDS = 15 * 60
const REGISTER_MAX = 3
const REGISTER_WINDOW_SECONDS = 60 * 60
const FORGOT_PASSWORD_MAX = 3
const FORGOT_PASSWORD_WINDOW_SECONDS = 60 * 60

// Lockout banner generik — hindari user enumeration.
const LOCKOUT_MESSAGE = 'Terlalu banyak permintaan. Coba lagi nanti.'

export async function register(
  formData: FormData,
  accessToken: string
) {
  const supabase = await createClient()

  // Server-side gate: REGISTER_ACCESS_TOKEN harus cocok (timingSafeEqual).
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

  // Per-key composite {ip}+{email} agar attacker tidak bypass via rotasi IP.
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

  revalidatePath('/', 'layout')
  redirect('/dashboard')
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

  // Per-email — cegah inbox bombing.
  const emailRaw = formData.get('email')
  if (typeof emailRaw === 'string' && emailRaw.length > 0) {
    const { allowed } = await checkAuthRateLimit(
      `forgot:email:${emailRaw.toLowerCase()}`,
      FORGOT_PASSWORD_MAX,
      FORGOT_PASSWORD_WINDOW_SECONDS
    )
    if (!allowed) {
      // Respons generik identik dengan sukses — jangan bocorkan rate-limit vs unregistered email.
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

  // Hanya NEXT_PUBLIC_APP_URL — JANGAN pakai Host header (Host Header Injection).
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    console.error('forgotPassword: NEXT_PUBLIC_APP_URL not configured')
    return {
      success:
        'Jika email terdaftar, link reset password telah dikirim. Cek inbox Anda.',
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

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    console.error('Reset password error:', error)
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/login?reset=success')
}
