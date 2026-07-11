import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Helper server-side untuk rate limiting berbasis Supabase RPC.
 *
 * TIDAK memakai direktif `'use server'` → tidak terekspos sebagai
 * Server Action publik. Aman di-import dari server actions/route handlers.
 */

/**
 * Ekstrak IP client dari header request. Fallsback ke 'unknown' bila
 * di luar request context (mis. unit test). Aman di belakang Vercel/
 * nginx terpercaya; dokumentasikan konfigurasi trust-proxy saat deploy.
 */
export async function getClientIp(): Promise<string> {
  try {
    const h = headers()
    const xff = h.get('x-forwarded-for')
    if (xff) {
      const first = xff.split(',')[0]?.trim()
      if (first) return first.slice(0, 64)
    }
    const realIp = h.get('x-real-ip')
    if (realIp) return realIp.slice(0, 64)
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * Cek apakah `key` masih di bawah limit untuk bucket auth.
 * Fail-open: jika RPC/admin-client unavailable, izinkan dengan logging.
 *
 * @param key identifier bucket (mis. "login:ip:email:{ip}:{email}")
 * @param maxCount jumlah request yang diizinkan dalam window
 * @param windowSeconds lebar window sliding (detik)
 */
export async function checkAuthRateLimit(
  key: string,
  maxCount: number,
  windowSeconds: number
): Promise<{ allowed: boolean; error: unknown }> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc('check_auth_rate_limit', {
      p_key: key,
      p_max_count: maxCount,
      p_window_seconds: windowSeconds,
    })
    if (error) {
      console.error('Auth rate limit check failed (fail-open):', error)
      return { allowed: true, error }
    }
    return { allowed: data !== false, error: null }
  } catch (err) {
    console.error('Auth rate limit threw (fail-open):', err)
    return { allowed: true, error: err }
  }
}
