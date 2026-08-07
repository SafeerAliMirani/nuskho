/**
 * THE SERVICE WORKER, AND WHY IT IS THE MOST CONSERVATIVE ONE POSSIBLE.
 *
 * Nuskho's real home is a folder on a clinic laptop, opened from the disk. This
 * worker exists only for the web copy, so that a doctor who is shown the app on
 * a phone can add it to his home screen and still open it in a village with no
 * signal.
 *
 * CACHE FIRST, ALWAYS. Not stale-while-revalidate, not network-first. A clinic
 * mid-consultation must never wait on a radio, and a half-updated app is worse
 * than an old one when the thing it prints is a prescription. A new version is
 * taken on the NEXT open, never in the middle of a session.
 *
 * NOTHING IS EVER POSTED. This worker has no fetch handler for anything but
 * GET, no background sync, no push. There is no server to talk to, and there
 * must never be one that patient data could reach.
 */
// BUMP THIS when welcome.html or login.html change: they are served cache-first
// out of this cache, so an edit that does not bump the version is an edit a
// returning visitor never sees.
const CACHE = 'nuskho-v24'

self.addEventListener('install', e => {
  // Take the shell now so the first offline open works. './' is the welcome
  // page (the physical index of the web build); './app' is the app itself.
  e.waitUntil((async () => {
    const c = await caches.open(CACHE)
    await c.addAll(['./', './app', './manifest.webmanifest', './icon.svg'])
  })())
})

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k)
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', e => {
  const r = e.request
  if (r.method !== 'GET') return
  const u = new URL(r.url)
  if (u.origin !== self.location.origin) return
  // The building's wire is never cached: a cached /hub.json would pin a
  // device into (or out of) building mode for ever, against a live answer.
  if (u.pathname === '/hub.json' || u.pathname === '/bus') return
  e.respondWith((async () => {
    const hit = await caches.match(r, { ignoreSearch: true })
    if (hit) return hit
    try {
      const res = await fetch(r)
      if (res.ok && res.type === 'basic') {
        const c = await caches.open(CACHE)
        c.put(r, res.clone())
      }
      return res
    } catch {
      // A navigation with no network falls back to the shell rather than to a
      // browser error page, which is what makes "add to home screen" honest.
      if (r.mode === 'navigate') {
        const shell = await caches.match('./app')
        if (shell) return shell
      }
      throw new Error('offline and not cached')
    }
  })())
})
