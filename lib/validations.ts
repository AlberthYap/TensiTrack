import { z } from 'zod'

/**
 * Schema zusammen untuk `measured_at` dengan window valid:
 * - Tidak lebih dari 1 tahun ke depan (mencegah typo/cheat)
 * - Tidak lebih dari 10 tahun ke belakang (record kuno tidak relevan)
 */
const measuredAtSchema = z
  .string()
  .min(1, 'Tanggal pengukuran harus diisi')
  .refine((val) => !isNaN(Date.parse(val)), {
    message: 'Tanggal pengukuran tidak valid',
  })
  .refine(
    (val) => {
      const d = new Date(val)
      const oneYearFromNow = new Date()
      oneYearFromNow.setFullYear(new Date().getFullYear() + 1)
      return d <= oneYearFromNow
    },
    { message: 'Tanggal pengukuran tidak boleh lebih dari 1 tahun ke depan' }
  )
  .refine(
    (val) => {
      const d = new Date(val)
      const tenYearsAgo = new Date()
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10)
      return d >= tenYearsAgo
    },
    { message: 'Tanggal pengukuran tidak boleh lebih dari 10 tahun yang lalu' }
  )

// Daftar password paling umum dari breach list publik (RockYou, SecLists).
// Tidak exhaustive — Supabase Auth yang tetap memvalidasi via bcrypt.
const COMMON_PASSWORDS = new Set([
  '12345678', 'password', '123456789', 'qwerty', 'qwerty123',
  '11111111', '1234567', '12345', '123456', '1234',
  'letmein', 'admin123', 'welcome1', 'dragon123', 'monkey123',
  'abc12345', 'football1', 'iloveyou1', 'master123', 'sunshine1',
  'princess1', 'login123', 'starwars', '654321', 'password1',
  'qwerty12', 'pass1234', 'passw0rd', 'trustno1', 'azerty123',
  '00000000', '12121212', 'qwertyu', 'asdfghjk', 'zxcvbnm12',
  'charlie1', 'jennifer', 'hunter2', 'freedom1', 'shadow12',
  'michael1', 'jordan23', 'jessica1', 'michelle', 'robert12',
])

// Schema bersama untuk password baru pada register/reset/change.
// Min 8 karakter (NIST SP 800-63B). Max 128 untuk mencegah DoS bcrypt.
// LoginSchema TIDAK memakai ini — user legacy mungkin punya password pendek.
const passwordField = z
  .string()
  .min(8, 'Password minimal 8 karakter')
  .max(128, 'Password maksimal 128 karakter')
  .refine(
    (val) => !COMMON_PASSWORDS.has(val.toLowerCase()),
    'Password terlalu umum, pilih password yang lebih unik'
  )

export const bloodPressureSchema = z.object({
  systolic: z
    .number()
    .int('Systolic harus bilangan bulat')
    .min(50, 'Systolic harus minimal 50 mmHg')
    .max(250, 'Systolic harus maksimal 250 mmHg'),
  diastolic: z
    .number()
    .int('Diastolic harus bilangan bulat')
    .min(30, 'Diastolic harus minimal 30 mmHg')
    .max(150, 'Diastolic harus maksimal 150 mmHg'),
  pulse: z
    .number()
    .int('Pulse harus bilangan bulat')
    .min(30, 'Pulse harus minimal 30 bpm')
    .max(200, 'Pulse harus maksimal 200 bpm')
    .nullable()
    .optional(),
  notes: z
    .string()
    .max(500, 'Catatan maksimal 500 karakter')
    .nullable()
    .optional(),
  measured_at: measuredAtSchema,
})

export const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: passwordField,
  full_name: z.string()
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
})

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password harus diisi'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email tidak valid'),
})

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: passwordField,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password dan konfirmasi tidak cocok',
    path: ['confirmPassword'],
  })

export type BloodPressureInput = z.infer<typeof bloodPressureSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
