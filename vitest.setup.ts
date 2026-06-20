import '@testing-library/jest-dom/vitest'
import { afterAll, beforeAll } from 'vitest'

// Suppress noisy console.error dari React act() warning di test environment
const originalError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = String(args[0])
    if (
      msg.includes('not wrapped in act') ||
      msg.includes('Warning: An update to')
    ) {
      return
    }
    originalError(...(args as []))
  }
})

afterAll(() => {
  console.error = originalError
})
