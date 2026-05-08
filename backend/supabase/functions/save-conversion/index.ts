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

function createShareToken() {
  const bytes = new Uint8Array(18)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders })
  }

  try {
    const formData = await request.formData()
    const originalFile = formData.get('originalFile')
    const processedFile = formData.get('processedFile')
    const settingsRaw = formData.get('settings')

    if (!(originalFile instanceof File) || !(processedFile instanceof File)) {
      return Response.json({ error: 'originalFile and processedFile are required.' }, { status: 400, headers: corsHeaders })
    }

    const conversionId = crypto.randomUUID()
    const shareToken = createShareToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const safeName = originalFile.name.replace(/[^\w.-]+/g, '-')

    const originalPath = `public/${conversionId}/${safeName}`
    const processedPath = `public/${conversionId}/clearpng-result.png`

    const originalUpload = await supabase.storage
      .from('original-images')
      .upload(originalPath, originalFile, {
        contentType: originalFile.type || 'application/octet-stream',
        upsert: false,
      })

    if (originalUpload.error) throw originalUpload.error

    const processedUpload = await supabase.storage
      .from('processed-images')
      .upload(processedPath, processedFile, {
        contentType: 'image/png',
        upsert: false,
      })

    if (processedUpload.error) throw processedUpload.error

    const settings = typeof settingsRaw === 'string' ? JSON.parse(settingsRaw || '{}') : {}
    const insert = await supabase.from('conversions').insert({
      id: conversionId,
      original_file_path: originalPath,
      processed_file_path: processedPath,
      original_file_name: originalFile.name,
      mime_type: originalFile.type || 'application/octet-stream',
      status: 'completed',
      settings,
      share_token: shareToken,
      expires_at: expiresAt,
    })

    if (insert.error) throw insert.error

    return Response.json(
      {
        conversionId,
        shareToken,
        expiresAt,
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
