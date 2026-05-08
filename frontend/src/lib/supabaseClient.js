import { createClient } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabaseConfig } from '@/config/supabaseConfig'

export const supabase = isSupabaseConfigured
  ? createClient(supabaseConfig.url, supabaseConfig.anonKey)
  : null

export function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase 환경 변수를 먼저 설정해 주세요.')
  }

  return supabase
}
