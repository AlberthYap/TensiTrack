import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      // Hanya include file yang punya test counterpart.
      // File lain (analytics.ts, export.ts, pdf-export.ts, utils.ts,
      // lib/supabase/{client,middleware,admin,server}.ts) belum punya
      // test di fase ini dan di-exclude dari threshold calculation.
      include: [
        'lib/blood-pressure.ts',
        'lib/validations.ts',
        'lib/date.ts',
        'lib/csv-import.ts',
        'lib/supabase/queries.ts',
        'app/actions/auth.ts',
        'app/actions/blood-pressure.ts',
        'app/actions/profile.ts',
        'app/actions/share.ts',
      ],
      exclude: [
        '**/*.types.ts',
        '**/*.d.ts',
        '**/node_modules/**',
        '**/.next/**',
        '**/*.test.ts',
        // Files without test counterpart (future work)
        'lib/export.ts',
        'lib/pdf-export.ts',
        'lib/utils.ts',
        'app/actions/analytics.ts',
        'lib/supabase/client.ts',
        'lib/supabase/server.ts',
        'lib/supabase/middleware.ts',
        'lib/supabase/admin.ts',
      ],
      thresholds: {
        // Threshold realistis untuk fase 8 test file prioritas.
        // Threshold aggregate only (perFile default false) agar
        // file besar seperti share.ts (859 baris, hanya validateShareToken
        // yang di-test) tidak menggagalkan build.
        // Target bertahap: naik ke 80% setelah semua file punya test.
        lines: 35,
        functions: 40,
        branches: 80,
        statements: 35,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
