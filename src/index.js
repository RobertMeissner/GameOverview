import { getAssetFromKV } from '@cloudflare/kv-asset-handler'

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  try {
    return await getAssetFromKV(event, {
      mapRequestToAsset: req => {
        const url = new URL(req.url)
        // Handle SPA routing - serve index.html for non-asset requests
        if (!url.pathname.includes('.') && url.pathname !== '/') {
          return new Request(`${url.origin}/index.html`, req)
        }
        return req
      }
    })
  } catch (e) {
    return new Response('Not found', { status: 404 })
  }
}
