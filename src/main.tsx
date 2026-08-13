import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { Boundary } from './Boundary'
import './ui/type.css'
import './app.css'
import { keepStorage, snapshotDaily } from './safety'
import { freshenDemo } from './demo'
import { initBuilding, buildingMode, buildingUnknown } from './building'
import { ensurePrintStyles } from './print/styles'
import { sendHeartbeat } from './heartbeat'
import { adoptOldPin } from './roles'

/**
 * BEFORE ANY DOOR IS DRAWN: carry across the lock a machine already had.
 *
 * A clinic that updated from the single-PIN build woke up with every role
 * opening on one tap, including the doctor's, because his PIN was still in
 * storage under a key nothing read any more. Synchronous and first, because the
 * front door is the very next thing this file renders.
 */
adoptOldPin()

// Before anything else: ask the browser not to treat a clinic's records as
// cache, then take today's local snapshot. Both are silent and both are the
// difference between a bad evening and a lost practice.
keepStorage().then(() => snapshotDaily()).catch(() => { /* never block the app */ })

/**
 * The practice copy clears itself after a gap — see demo.ts.
 *
 * This is awaited, unlike everything else here, because rendering first would
 * paint yesterday's practice patients for a moment before deleting them, and
 * the one thing a demo must not do is look unreliable. In a real clinic build
 * it returns immediately and costs nothing.
 */
freshenDemo()
  .catch(() => false)
  // One question before the first paint: is this copy inside a building?
  // Only a wifi hub on our own origin answers yes. The clinic folder and the
  // public web copy cannot, so for them this is a no-op measured in
  // milliseconds — and a phone must know it is a mirror BEFORE it renders,
  // or it would flash the record holder's screens at a device that holds
  // no records.
  .then(() => initBuilding())
  .catch(() => undefined)
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode><Boundary><App /></Boundary></StrictMode>
    )
    // The Sindhi face for the SCREEN. app.css says font-family:'NK' in 24
    // places, but the @font-face for NK lived only in the print stylesheet,
    // which a mirror phone never injects because nothing there prints. On
    // Windows the generic serif fallback happens to cover Sindhi letters; on
    // an iPhone it is Times, and ٻ ڀ ڏ ڙ ڪ ڳ ڻ are exactly the letters a
    // generic fallback drops. The bytes are already in this bundle (the print
    // module imports them ?raw), so injecting after first paint costs no
    // download, only makes the rules resolve.
    setTimeout(() => { try { ensurePrintStyles() } catch { /* screen still works in fallback */ } }, 300)
    // The opt-in heartbeat: two fields, fire and forget, cannot block, cannot
    // throw past its own catch. See src/heartbeat.ts for the whole contract.
    setTimeout(() => sendHeartbeat(), 1200)
    // AFTER initBuilding has decided what this copy is: registering from a
    // top-level 'load' listener ran before the decision existed and would
    // have installed the cache-first worker on the hub origin anyway.
    // buildingUnknown(): the hub probe FAILED rather than answered, so this
    // may be the hub origin behind one wifi blink. Registering now would pin
    // the device to a cache-first worker it can never shed; skipping costs
    // one visit's offline cache on the public site, which re-registers next
    // open. Be wrong in the recoverable direction.
    if (location.protocol.startsWith('http') && 'serviceWorker' in navigator
        && buildingMode() === 'off' && !buildingUnknown()) {
      navigator.serviceWorker.register('./sw.js').catch(() => { /* offline is optional */ })
    }
  })

/**
 * The offline worker registers ONLY when served over http(s), and NEVER on
 * the building's wire — see the registration inside the chain above.
 *
 * The clinic install is opened from a folder, where service workers do not
 * exist and must not be asked for. The web copy alone uses it, so a doctor
 * shown the app on a phone can keep it. On the wifi hub's origin the worker
 * would be a saboteur: the hub serves every file fresh so a new build reaches
 * every device on reload, and a cache-first worker would pin the whole
 * building to whatever build it first saw — host and phones silently running
 * different wire protocols. The wire needs no offline cache anyway: no wifi,
 * no building.
 */
