import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Server-side helper for rate limiting backed by Supabase RPC.
 *
 * Does NOT use the `'use server'` directive → not exposed as a public
 * Server Action. Safe to import from server actions and route handlers.
 */

/**
 * Extract client IP from request headers. Falls back to 'unknown' when
 * outside request context (e.g. unit tests). Safe behind trusted
 * Vercel/nginx proxies; document trust-proxy configuration on deploy.
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
 * Check whether `key` is still under the auth bucket limit.
 * Fail-open: if RPC/admin-client is unavailable, allow with logging.
 *
 * @param key bucket identifier (e.g. "login:ip:email:{ip}:{email}")
 * @param maxCount allowed request count within the window
 * @param windowSeconds sliding window width (seconds)
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
