/**
 * Hand-maintained types for the Phase 1 schema (profiles only).
 * Regenerate/extend this when Phase 2 migrations are added.
 */
export type ThemeValue = 'light' | 'dark'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nickname: string
          currency_code: string
          theme: ThemeValue
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nickname?: string
          currency_code?: string
          theme?: ThemeValue
          created_at?: string
          updated_at?: string
        }
        Update: {
          nickname?: string
          currency_code?: string
          theme?: ThemeValue
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
