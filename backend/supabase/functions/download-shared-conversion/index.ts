import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'GET, OPTIONS',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

function makeDownloadName(originalFileName: string) {
  const baseName = originalFileName.replace(/\.[^.]+$/, '') || 'clearpng'
  return `${baseName}-transparent.png`.replace(/[^\w.-]+/g, '-')
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders })
  }

  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return Response.json({ error: 'token is required.' }, { status: 400, headers: corsHeaders })
    }

    const { data, error } = await supabase
      .from('conversions')
      .select('original_file_name, processed_file_path')
      .eq('share_token', token)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) {
      return Response.json({ error: 'Shared conversion not found.' }, { status: 404, headers: corsHeaders })
    }

    const { data: file, error: downloadError } = await supabase.storage
      .from('processed-images')
      .download(data.processed_file_path)

    if (downloadError || !file) throw downloadError

    return new Response(file, {
      headers: {
        ...corsHeaders,
        'content-type': 'image/png',
        'content-disposition': `attachment; filename="${makeDownloadName(data.original_file_name)}"`,
        'cache-control': 'private, max-age=300',
      },
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500, headers: corsHeaders },
    )
  }
})
