import { describe, expect, it } from 'vitest'
import {
  bloodPressureSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@/lib/validations'

describe('bloodPressureSchema', () => {
  const validInput = {
    systolic: 120,
    diastolic: 80,
    pulse: 72,
    notes: 'pagi',
    measured_at: new Date().toISOString(),
  }

  it('accepts valid input', () => {
    const result = bloodPressureSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('accepts input without optional pulse/notes', () => {
    const result = bloodPressureSchema.safeParse({
      systolic: 120,
      diastolic: 80,
      measured_at: new Date().toISOString(),
    })
    expect(result.success).toBe(true)
  })

  // BUG REGRESSION TEST: bug #5 — strict validation with .int() and ranges
  describe('systolic validation', () => {
    it('rejects non-integer (regression: bug #5 .int() check)', () => {
      const result = bloodPressureSchema.safeParse({
        ...validInput,
        systolic: 120.5,
      })
      expect(result.success).toBe(false)
    })

    it('rejects below 50 mmHg', () => {
      const result = bloodPressureSchema.safeParse({ ...validInput, systolic: 49 })
      expect(result.success).toBe(false)
    })

    it('rejects above 250 mmHg', () => {
      const result = bloodPressureSchema.safeParse({ ...validInput, systolic: 251 })
      expect(result.success).toBe(false)
    })

    it('accepts boundary 50 mmHg', () => {
      const result = bloodPressureSchema.safeParse({ ...validInput, systolic: 50 })
      expect(result.success).toBe(true)
    })

    it('accepts boundary 250 mmHg', () => {
      const result = bloodPressureSchema.safeParse({ ...validInput, systolic: 250 })
      expect(result.success).toBe(true)
    })
  })

  describe('diastolic validation', () => {
    it('rejects non-integer (regression: bug #5 .int() check)', () => {
      const result = bloodPressureSchema.safeParse({
        ...validInput,
        diastolic: 80.7,
      })
      expect(result.success).toBe(false)
    })

    it('rejects below 30 mmHg', () => {
      const result = bloodPressureSchema.safeParse({ ...validInput, diastolic: 29 })
      expect(result.success).toBe(false)
    })

    it('rejects above 150 mmHg', () => {
      const result = bloodPressureSchema.safeParse({ ...validInput, diastolic: 151 })
      expect(result.success).toBe(false)
    })
  })

  describe('pulse validation', () => {
    it('rejects non-integer when provided (regression: bug #5 .int() check)', () => {
      const result = bloodPressureSchema.safeParse({
        ...validInput,
        pulse: 72.5,
      })
      expect(result.success).toBe(false)
    })

    it('accepts null pulse', () => {
      const result = bloodPressureSchema.safeParse({ ...validInput, pulse: null })
      expect(result.success).toBe(true)
    })

    it('rejects pulse < 30 or > 200', () => {
      expect(bloodPressureSchema.safeParse({ ...validInput, pulse: 29 }).success).toBe(false)
      expect(bloodPressureSchema.safeParse({ ...validInput, pulse: 201 }).success).toBe(false)
    })
  })

  // BUG REGRESSION TEST: bug #5 — measured_at strict validation
  describe('measured_at validation (regression: bug #5 strict date)', () => {
    it('rejects empty string', () => {
      const result = bloodPressureSchema.safeParse({ ...validInput, measured_at: '' })
      expect(result.success).toBe(false)
    })

    it('rejects non-parseable date string', () => {
      const result = bloodPressureSchema.safeParse({
        ...validInput,
        measured_at: 'bukan tanggal',
      })
      expect(result.success).toBe(false)
    })

    it('rejects date more than 1 year in future', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 2)
      const result = bloodPressureSchema.safeParse({
        ...validInput,
        measured_at: futureDate.toISOString(),
      })
      expect(result.success).toBe(false)
    })

    it('rejects date more than 10 years in past', () => {
      const oldDate = new Date()
      oldDate.setFullYear(oldDate.getFullYear() - 11)
      const result = bloodPressureSchema.safeParse({
        ...validInput,
        measured_at: oldDate.toISOString(),
      })
      expect(result.success).toBe(false)
    })

    it('accepts today', () => {
      const result = bloodPressureSchema.safeParse({
        ...validInput,
        measured_at: new Date().toISOString(),
      })
      expect(result.success).toBe(true)
    })

    it('accepts date 1 year ago', () => {
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      const result = bloodPressureSchema.safeParse({
        ...validInput,
        measured_at: oneYearAgo.toISOString(),
      })
      expect(result.success).toBe(true)
    })
  })

  describe('notes validation', () => {
    it('rejects notes > 500 chars', () => {
      const result = bloodPressureSchema.safeParse({
        ...validInput,
        notes: 'a'.repeat(501),
      })
      expect(result.success).toBe(false)
    })

    it('accepts null notes', () => {
      const result = bloodPressureSchema.safeParse({ ...validInput, notes: null })
      expect(result.success).toBe(true)
    })
  })
})

describe('registerSchema', () => {
  it('accepts valid registration', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'secret123',
      full_name: 'John Doe',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'secret123',
      full_name: 'John',
    })
    expect(result.success).toBe(false)
  })

  it('rejects password < 6 chars', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: '12345',
      full_name: 'John',
    })
    expect(result.success).toBe(false)
  })

  it('rejects name < 2 chars', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'secret123',
      full_name: 'J',
    })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('accepts valid login', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'any-password',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('accepts matching passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'newpass123',
      confirmPassword: 'newpass123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects non-matching passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'newpass123',
      confirmPassword: 'different',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short password', () => {
    const result = resetPasswordSchema.safeParse({
      password: '12345',
      confirmPassword: '12345',
    })
    expect(result.success).toBe(false)
  })
})
