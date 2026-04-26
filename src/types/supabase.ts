/**
 * Tipos gerados pelo Supabase CLI.
 *
 * Para regenerar após conectar ao projeto Supabase:
 *   npx supabase gen types typescript --project-id <PROJECT_ID> > src/types/supabase.ts
 *
 * Este stub será sobrescrito após a configuração do projeto Supabase.
 */
export type Database = {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
