/** Hand-maintained types for the Phase 2 schema with the D-019 unified ledger. */

export type ThemeValue = 'light' | 'dark'
export type CategoryType = 'income' | 'expense'
export type LedgerType = 'income' | 'expense' | 'transfer'

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
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          initial_amount: number
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          initial_amount?: number
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          initial_amount?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          type: CategoryType
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: CategoryType
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          type?: CategoryType
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: LedgerType
          occurred_at: string
          account_id: string
          to_account_id: string | null
          category_id: string | null
          amount: number
          fee_amount: number
          payee: string | null
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: LedgerType
          occurred_at: string
          account_id: string
          to_account_id?: string | null
          category_id?: string | null
          amount: number
          fee_amount?: number
          payee?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          type?: LedgerType
          occurred_at?: string
          account_id?: string
          to_account_id?: string | null
          category_id?: string | null
          amount?: number
          fee_amount?: number
          payee?: string | null
          note?: string | null
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
