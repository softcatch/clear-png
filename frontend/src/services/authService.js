import { isSupabaseConfigured } from '@/config/supabaseConfig'
import { requireSupabase, supabase } from '@/lib/supabaseClient'

export { isSupabaseConfigured }

export async function getCurrentUser() {
  if (!supabase) return null

  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user
}

export async function signInWithPassword({ email, password }) {
  const client = requireSupabase()
  const { data, error } = await client.auth.signInWithPassword({ email, password })

  if (error) throw error
  return data.user
}

export async function signUpWithPassword({ email, password }) {
  const client = requireSupabase()
  const { data, error } = await client.auth.signUp({ email, password })

  if (error) throw error
  return data
}

export async function signOut() {
  const client = requireSupabase()
  const { error } = await client.auth.signOut()

  if (error) throw error
}
