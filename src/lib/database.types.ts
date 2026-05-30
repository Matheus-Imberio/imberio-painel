// Tipos gerados baseados no schema do Supabase

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
          name: string
          role: 'admin' | 'operador'
          created_at: string
        }
        Insert: {
          id: string
          name: string
          role: 'admin' | 'operador'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: 'admin' | 'operador'
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          nome: string
          endereco: string | null
          telefone: string | null
          celular: string | null
          observacoes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          endereco?: string | null
          telefone?: string | null
          celular?: string | null
          observacoes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          endereco?: string | null
          telefone?: string | null
          celular?: string | null
          observacoes?: string | null
          created_at?: string
        }
      }
      motors: {
        Row: {
          id: string
          equipamento: string | null
          tipo: string | null
          modelo: string | null
          cv: string | null
          tensao: string | null
          rpm: string | null
          passe: string | null
          espiras: string | null
          fios: string | null
          ligacao: string | null
          diametro_externo: string | null
          comprimento_externo: string | null
          numero_serie: string | null
          marca: string | null
          original: boolean | null
          partida: string | null
          trabalho: string | null
          created_at: string
        }
        Insert: {
          id?: string
          equipamento?: string | null
          tipo?: string | null
          modelo?: string | null
          cv?: string | null
          tensao?: string | null
          rpm?: string | null
          passe?: string | null
          espiras?: string | null
          fios?: string | null
          ligacao?: string | null
          diametro_externo?: string | null
          comprimento_externo?: string | null
          numero_serie?: string | null
          marca?: string | null
          original?: boolean | null
          partida?: string | null
          trabalho?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          equipamento?: string | null
          tipo?: string | null
          modelo?: string | null
          cv?: string | null
          tensao?: string | null
          rpm?: string | null
          passe?: string | null
          espiras?: string | null
          fios?: string | null
          ligacao?: string | null
          diametro_externo?: string | null
          comprimento_externo?: string | null
          numero_serie?: string | null
          marca?: string | null
          original?: boolean | null
          partida?: string | null
          trabalho?: string | null
          created_at?: string
        }
      }
      parts: {
        Row: {
          id: string
          nome: string
          tipo: string | null
          valor: number
          unidade: string | null
          observacoes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          tipo?: string | null
          valor: number
          unidade?: string | null
          observacoes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          tipo?: string | null
          valor?: number
          unidade?: string | null
          observacoes?: string | null
          created_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          client_id: string | null
          operador_id: string | null
          motor_id: string | null
          data: string
          valor_total: number | null
          desconto_percentual: number | null
          laudo_tecnico: string | null
          observacoes: string | null
          status: 'pre_orcamento' | 'pendente' | 'concluido' | 'baixado'
          tipo_pagamento: string | null
        }
        Insert: {
          id?: string
          client_id?: string | null
          operador_id?: string | null
          motor_id?: string | null
          data?: string
          valor_total?: number | null
          desconto_percentual?: number | null
          laudo_tecnico?: string | null
          observacoes?: string | null
          status?: 'pre_orcamento' | 'pendente' | 'concluido' | 'baixado'
          tipo_pagamento?: string | null
        }
        Update: {
          id?: string
          client_id?: string | null
          operador_id?: string | null
          motor_id?: string | null
          data?: string
          valor_total?: number | null
          desconto_percentual?: number | null
          laudo_tecnico?: string | null
          observacoes?: string | null
          status?: 'pre_orcamento' | 'pendente' | 'concluido' | 'baixado'
          tipo_pagamento?: string | null
        }
      }
      budget_items: {
        Row: {
          id: string
          budget_id: string | null
          part_id: string | null
          quantidade: number
          valor_unitario: number
          subtotal: number
        }
        Insert: {
          id?: string
          budget_id?: string | null
          part_id?: string | null
          quantidade: number
          valor_unitario: number
        }
        Update: {
          id?: string
          budget_id?: string | null
          part_id?: string | null
          quantidade?: number
          valor_unitario?: number
        }
      }
    }
  }
}

// Tipos auxiliares para uso no app
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Motor = Database['public']['Tables']['motors']['Row']
export type Part = Database['public']['Tables']['parts']['Row']
export type Budget = Database['public']['Tables']['budgets']['Row']
export type BudgetItem = Database['public']['Tables']['budget_items']['Row']

// Tipos para inserção
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type MotorInsert = Database['public']['Tables']['motors']['Insert']
export type PartInsert = Database['public']['Tables']['parts']['Insert']
export type BudgetInsert = Database['public']['Tables']['budgets']['Insert']
export type BudgetItemInsert = Database['public']['Tables']['budget_items']['Insert']

// Tipos para atualização
export type ClientUpdate = Database['public']['Tables']['clients']['Update']
export type MotorUpdate = Database['public']['Tables']['motors']['Update']
export type PartUpdate = Database['public']['Tables']['parts']['Update']
export type BudgetUpdate = Database['public']['Tables']['budgets']['Update']
export type BudgetItemUpdate = Database['public']['Tables']['budget_items']['Update']

// Tipo expandido de Budget com relacionamentos
export interface BudgetWithRelations extends Budget {
  client: Client | null
  operador: Profile | null
  motor: Motor | null
  items: (BudgetItem & { part: Part | null })[]
}

