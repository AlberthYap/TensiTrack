export type BloodPressureCategory = 
  | 'low' 
  | 'normal' 
  | 'elevated' 
  | 'hypertension_stage_1' 
  | 'hypertension_stage_2'

export interface BloodPressureRecord {
  id: string
  user_id: string
  systolic: number
  diastolic: number
  pulse: number | null
  category: BloodPressureCategory
  notes: string | null
  measured_at: string
  created_at: string
  updated_at: string
}

export interface BloodPressureInput {
  systolic: number
  diastolic: number
  pulse?: number | null
  notes?: string | null
  measured_at: string
}

export interface CategoryInfo {
  label: string
  color: string
  bgColor: string
  description: string
}
