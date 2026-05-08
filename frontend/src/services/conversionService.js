import { requireSupabase } from '@/lib/supabaseClient'

export async function uploadConversionAssets({ originalFile, processedBlob, settings }) {
  const client = requireSupabase()
  const formData = new FormData()

  formData.append('originalFile', originalFile)
  formData.append('processedFile', processedBlob, 'clearpng-result.png')
  formData.append('settings', JSON.stringify(settings ?? {}))

  const { data, error } = await client.functions.invoke('save-conversion', {
    body: formData,
  })

  if (error) throw error

  return {
    conversionId: data.conversionId,
    shareToken: data.shareToken,
    expiresAt: data.expiresAt,
  }
}

export async function fetchSharedConversion(token) {
  const client = requireSupabase()

  const { data, error } = await client.functions.invoke('get-shared-conversion', {
    body: { token },
  })

  if (error) throw error

  return {
    original_file_name: data.originalFileName,
    expires_at: data.expiresAt,
    publicUrl: data.downloadUrl,
  }
}
