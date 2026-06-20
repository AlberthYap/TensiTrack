'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validations'

export async function register(formData: FormData) {
  const supabase = await createClient()

  // Validate input
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

  // Sign up user
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

  // Validate input
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

  // Sign in user
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Provide more helpful error messages
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

  const validatedFields = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message }
  }

  const { email } = validatedFields.data

  // Determine the base URL from the request headers
  const headersList = headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`
  const redirectTo = `${baseUrl}/reset-password`

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) {
    // For security, do not reveal whether the email is registered.
    // Return success message either way unless there's a true server error.
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

  // Verify user has an active session (came from email link)
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
