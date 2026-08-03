import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { Boundary } from './Boundary'
import './ui/type.css'
import './app.css'
import { keepStorage, snapshotDaily } from './safety'

// Before anything else: ask the browser not to treat a clinic's records as
// cache, then take today's local snapshot. Both are silent and both are the
// difference between a bad evening and a lost practice.
keepStorage().then(() => snapshotDaily()).catch(() => { /* never block the app */ })

createRoot(document.getElementById('root')!).render(
  <StrictMode><Boundary><App /></Boundary></StrictMode>
)

/**
 * Register the offline worker ONLY when served over http(s).
 *
 * The clinic install is opened from a folder, where service workers do not
 * exist and must not be asked for. This is for the web copy alone, so a doctor
 * shown the app on a phone can keep it. Failure is silent by design: an app
 * that will not start because a cache did not register would be a worse app.
 */
if (location.protocol.startsWith('http') && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* offline is optional */ })
  })
}
