import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { Boundary } from './Boundary'
import './ui/type.css'
import './app.css'
import { keepStorage, snapshotDaily } from './safety'
import { freshenDemo } from './demo'
import { initBuilding, buildingMode } from './building'
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
    // AFTER initBuilding has decided what this copy is: registering from a
    // top-level 'load' listener ran before the decision existed and would
    // have installed the cache-first worker on the hub origin anyway.
    if (location.protocol.startsWith('http') && 'serviceWorker' in navigator && buildingMode() === 'off') {
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
