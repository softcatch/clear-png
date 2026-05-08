// Placeholder for future server-side image processing.
// Deploy with: supabase functions deploy process-image
Deno.serve(() => {
  return new Response(
    JSON.stringify({
      status: 'not_implemented',
      message: 'ClearPNG currently processes images in the browser with Canvas API.',
    }),
    {
      headers: { 'content-type': 'application/json' },
      status: 501,
    },
  )
})
