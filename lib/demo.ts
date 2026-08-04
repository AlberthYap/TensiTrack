import { checkAuthRateLimit, getClientIp } from '@/lib/rate-limit'

/**
 * Demo user configuration.
 *
 * Demo account is used by visitors who want to try the app without creating
 * their own account. Data entered by demo users is automatically deleted
 * after 24 hours.
 */
export const DEMO_EMAIL = 'guest@tensitrack.com'
export const DEMO_PASSWORD = 'guest@tensitrack.com'

export const DEMO_MUTATE_MAX = 30
export const DEMO_MUTATE_WINDOW_SECONDS = 60 * 60 // 1 hour
export const DEMO_MUTATE_LOCKOUT_MESSAGE =
  'Batas demo tercapai. Silakan buat akun gratis untuk melanjutkan.'
export const DEMO_RECORD_HARD_CAP = 100
export const DEMO_SHARE_HARD_CAP = 50

/**
 * Check whether an email belongs to the demo account.
 * Case-insensitive comparison to avoid capitalization issues.
 */
export function isDemoEmail(email: string | null | undefined): boolean {
  return email?.toLowerCase() === DEMO_EMAIL.toLowerCase()
}

/**
 * Display label for the demo account.
 */
export const DEMO_DISPLAY_NAME = 'Demo Guest'

/**
 * Check rate limit for demo users based on IP.
 * Only returns an error if the user is a demo user and the rate limit has
 * been exceeded.
 *
 * @param scope - rate limit category, e.g. 'record' or 'share'
 */
export async function checkDemoRateLimit(
  userEmail: string | undefined,
  scope = 'mutate'
): Promise<{ error?: string }> {
  if (!isDemoEmail(userEmail)) {
    return {}
  }

  const ip = await getClientIp()
  const { allowed } = await checkAuthRateLimit(
    `demo:${scope}:${ip}`,
    DEMO_MUTATE_MAX,
    DEMO_MUTATE_WINDOW_SECONDS
  )

  if (!allowed) {
    return { error: DEMO_MUTATE_LOCKOUT_MESSAGE }
  }

  return {}
}
