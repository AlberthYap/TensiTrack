/**
 * Seed script to create the demo account.
 *
 * Usage:
 *   npx tsx scripts/seed-demo-user.ts
 *
 * Required environment variables:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * Demo account:
 *   Email   : guest@tensitrack.com
 *   Password: guest@tensitrack.com
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const DEMO_EMAIL = 'guest@tensitrack.com'
const DEMO_PASSWORD = 'guest@tensitrack.com'
const DEMO_FULL_NAME = 'Demo Guest'

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      'Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.'
    )
    process.exit(1)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Check if demo user already exists
  const { data: existingUsers } = await adminClient.auth.admin.listUsers()
  const existingDemoUser = existingUsers.users.find(
    (user) => user.email?.toLowerCase() === DEMO_EMAIL.toLowerCase()
  )

  if (existingDemoUser) {
    console.log(`Demo account already exists: ${DEMO_EMAIL} (id: ${existingDemoUser.id})`)

    // Ensure the is_demo flag is set on the profiles table
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, is_demo')
      .eq('id', existingDemoUser.id)
      .maybeSingle()

    if (profile && !profile.is_demo) {
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({ is_demo: true })
        .eq('id', existingDemoUser.id)

      if (updateError) {
        console.error('Failed to update is_demo flag:', updateError.message)
        process.exit(1)
      }
      console.log('is_demo flag updated successfully.')
    }

    return
  }

  // Create new demo user
  const { data, error } = await adminClient.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: DEMO_FULL_NAME,
    },
  })

  if (error) {
    console.error('Failed to create demo account:', error.message)
    process.exit(1)
  }

  if (!data.user) {
    console.error('Failed to create demo account: user was not created')
    process.exit(1)
  }

  // The on_auth_user_created trigger creates the profiles row asynchronously.
  // Wait and ensure the is_demo flag is set. If the trigger does not fire,
  // fall back to a manual upsert so the seed remains robust.
  const profileReady = await waitForDemoProfile(adminClient, data.user.id)
  if (!profileReady) {
    console.error('Timed out waiting for profiles row from on_auth_user_created trigger.')
    process.exit(1)
  }

  // Fallback / defense-in-depth: ensure the profile exists and is_demo is set.
  const { error: upsertError } = await adminClient.from('profiles').upsert(
    {
      id: data.user.id,
      email: DEMO_EMAIL,
      is_demo: true,
      full_name: DEMO_FULL_NAME,
    },
    { onConflict: 'id' }
  )
  if (upsertError) {
    console.error('Failed to update is_demo flag via upsert:', upsertError.message)
    process.exit(1)
  }

  console.log(`Demo account created successfully: ${DEMO_EMAIL}`)
  console.log(`User ID: ${data.user.id}`)
}

async function waitForDemoProfile(
  adminClient: SupabaseClient,
  userId: string,
  maxAttempts = 15
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data: profile, error: selectError } = await adminClient
      .from('profiles')
      .select('id, is_demo')
      .eq('id', userId)
      .maybeSingle()

    if (selectError) {
      console.error('Failed to check profile:', selectError.message)
      return false
    }

    if (profile) {
      if (!profile.is_demo) {
        const { error: updateError } = await adminClient
          .from('profiles')
          .update({ is_demo: true })
          .eq('id', userId)

        if (updateError) {
          console.error('Failed to update is_demo flag:', updateError.message)
          return false
        }
        console.log('is_demo flag updated successfully.')
      }
      return true
    }

    // Wait for the trigger to create the profiles row.
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  return false
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
