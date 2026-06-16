import { z } from 'zod'

export const bloodPressureSchema = z.object({
  systolic: z
    .number()
    .min(50, 'Systolic harus minimal 50 mmHg')
    .max(250, 'Systolic harus maksimal 250 mmHg'),
  diastolic: z
    .number()
    .min(30, 'Diastolic harus minimal 30 mmHg')
    .max(150, 'Diastolic harus maksimal 150 mmHg'),
  pulse: z
    .number()
    .min(30, 'Pulse harus minimal 30 bpm')
    .max(200, 'Pulse harus maksimal 200 bpm')
    .nullable()
    .optional(),
  notes: z
    .string()
    .max(500, 'Catatan maksimal 500 karakter')
    .nullable()
    .optional(),
  measured_at: z.string(),
})

export const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  full_name: z.string().min(2, 'Nama minimal 2 karakter'),
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
    password: z.string().min(6, 'Password minimal 6 karakter'),
    confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
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
