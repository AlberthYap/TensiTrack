export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          date_of_birth: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          date_of_birth?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          date_of_birth?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      blood_pressure_records: {
        Row: {
          id: string
          user_id: string
          systolic: number
          diastolic: number
          pulse: number | null
          category: string
          notes: string | null
          measured_at: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          systolic: number
          diastolic: number
          pulse?: number | null
          category: string
          notes?: string | null
          measured_at: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          systolic?: number
          diastolic?: number
          pulse?: number | null
          category?: string
          notes?: string | null
          measured_at?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
    }
  }
}
