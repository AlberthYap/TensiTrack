'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { registerSchema, loginSchema } from '@/lib/validations'

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
      error: validatedFields.error.errors[0].message,
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
      error: validatedFields.error.errors[0].message,
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
