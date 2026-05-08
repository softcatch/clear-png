export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  buckets: {
    originals: import.meta.env.VITE_SUPABASE_ORIGINAL_BUCKET || 'original-images',
    processed: import.meta.env.VITE_SUPABASE_PROCESSED_BUCKET || 'processed-images',
  },
  tables: {
    conversions: import.meta.env.VITE_SUPABASE_CONVERSIONS_TABLE || 'conversions',
  },
}

export const isSupabaseConfigured = Boolean(supabaseConfig.url && supabaseConfig.anonKey)
