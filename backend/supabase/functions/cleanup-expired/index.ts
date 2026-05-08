import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { 'content-type': 'application/json' },
      status: 405,
    })
  }

  const now = new Date().toISOString()
  const { data: expired, error: selectError } = await supabase
    .from('conversions')
    .select('id, original_file_path, processed_file_path')
    .lte('expires_at', now)
    .neq('status', 'expired')
    .limit(100)

  if (selectError) {
    return new Response(JSON.stringify({ error: selectError.message }), {
      headers: { 'content-type': 'application/json' },
      status: 500,
    })
  }

  if (!expired?.length) {
    return new Response(JSON.stringify({ expired: 0 }), {
      headers: { 'content-type': 'application/json' },
    })
  }

  const originalPaths = expired.map((item) => item.original_file_path).filter(Boolean)
  const processedPaths = expired.map((item) => item.processed_file_path).filter(Boolean)

  if (originalPaths.length) {
    const { error: originalRemoveError } = await supabase.storage.from('original-images').remove(originalPaths)

    if (originalRemoveError) {
      return new Response(JSON.stringify({ error: originalRemoveError.message }), {
        headers: { 'content-type': 'application/json' },
        status: 500,
      })
    }
  }

  if (processedPaths.length) {
    const { error: processedRemoveError } = await supabase.storage.from('processed-images').remove(processedPaths)

    if (processedRemoveError) {
      return new Response(JSON.stringify({ error: processedRemoveError.message }), {
        headers: { 'content-type': 'application/json' },
        status: 500,
      })
    }
  }

  const { error: updateError } = await supabase
    .from('conversions')
    .update({ status: 'expired' })
    .in(
      'id',
      expired.map((item) => item.id),
    )

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      headers: { 'content-type': 'application/json' },
      status: 500,
    })
  }

  return new Response(JSON.stringify({ expired: expired.length }), {
    headers: { 'content-type': 'application/json' },
  })
})
