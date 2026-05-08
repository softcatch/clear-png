import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders })
  }

  try {
    const { token } = await request.json()

    if (!token) {
      return Response.json({ error: 'token is required.' }, { status: 400, headers: corsHeaders })
    }

    const { data, error } = await supabase
      .from('conversions')
      .select('original_file_name, processed_file_path, expires_at')
      .eq('share_token', token)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) {
      return Response.json({ error: 'Shared conversion not found.' }, { status: 404, headers: corsHeaders })
    }

    const signed = await supabase.storage
      .from('processed-images')
      .createSignedUrl(data.processed_file_path, 60 * 5)

    if (signed.error) throw signed.error

    return Response.json(
      {
        originalFileName: data.original_file_name,
        expiresAt: data.expires_at,
        downloadUrl: signed.data.signedUrl,
      },
      { headers: corsHeaders },
    )
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500, headers: corsHeaders },
    )
  }
})
