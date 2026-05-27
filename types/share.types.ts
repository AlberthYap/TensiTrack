export interface ShareToken {
  id: string
  user_id: string
  token: string
  expires_at: string | null
  is_active: boolean
  view_count: number
  max_views: number | null
  created_at: string
  updated_at: string
}

export interface ShareTokenInput {
  expires_in_days?: number | null
  max_views?: number | null
}
