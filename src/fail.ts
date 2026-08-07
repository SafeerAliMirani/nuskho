/**
 * WHEN THE MACHINE REFUSES, SOMEBODY MUST BE TOLD.
 *
 * The worst kind of bug in this app is not one that shows an error. It is one
 * that shows nothing. The compounder types a name, presses "Add to queue", the
 * button says Adding and then says Add to queue again, and the patient is not
 * in the list. He presses it again. And again. Then he decides the computer is
 * slow tonight and carries on, and three people who paid are not in the
 * evening's figures, and nobody finds out until the drawer is counted.
 *
 * That was the real state of the door: `try { await addNew() } finally { ... }`
 * with no catch. Every write on that screen behaved the same way.
 *
 * WHAT A MESSAGE HERE HAS TO DO, IN ORDER:
 *
 *   1. Say whether anything was lost. Almost always nothing was, and a person
 *      standing at a door with a queue behind him needs to know that first.
 *   2. Say what to do in the next ten seconds. Not what went wrong: what to do.
 *   3. Only then, if it helps, say why.
 *
 * WHAT IT MUST NEVER DO: show a person the words QuotaExceededError,
 * DOMException, or a stack. Those are for the console, and they go there.
 *
 * THE FALLBACK IS ALWAYS PAPER. This clinic worked before Nuskho and it will
 * work during the ninety seconds Nuskho is broken. Saying "use the pad" is not
 * an admission of defeat, it is the honest instruction, and a doctor trusts a
 * system that says it more than one that pretends it cannot happen.
 */

/** Everything a thrown thing might carry a name in. */
function nameOf(e: unknown): string {
  if (!e) return ''
  if (typeof e === 'string') return e
  const o = e as { name?: unknown; message?: unknown; inner?: unknown }
  const bits = [
    typeof o.name === 'string' ? o.name : '',
    typeof o.message === 'string' ? o.message : '',
    // Dexie wraps the original: a quota failure arrives as an OpenFailedError
    // whose inner error is the QuotaExceededError, and reading only the outer
    // one gives every storage problem the same useless sentence.
    o.inner ? nameOf(o.inner) : '',
  ]
  return bits.join(' ')
}

/**
 * The sentence to put in front of a person, for a failure while saving.
 *
 * `did` names the thing that did not happen, in the words of the room, so the
 * same failure reads correctly at the door and in the prescription screen:
 * "The patient was not added", "The prescription was not saved".
 */
export function whyItFailed(e: unknown, did = 'It was not saved'): string {
  const s = nameOf(e)
  const has = (...w: string[]) => w.some(x => s.toLowerCase().includes(x.toLowerCase()))

  // The disk, or the browser's allowance for this site, is full. Real on a
  // clinic PC that has been photographing X-rays into My Documents for a year.
  if (has('Quota', 'storage is full', 'NS_ERROR_FILE_NO_DEVICE'))
    return `${did}, because this computer has no room left to save anything. `
      + 'Take a backup to the pen drive now, then free some space on the disk. '
      + 'Use the paper pad until it is done.'

  // Another window has the database open at a different version, or an upgrade
  // is waiting for this tab to let go. Both are fixed by the same two actions.
  if (has('VersionError', 'blocked', 'UpgradeError', 'AbortError', 'DatabaseClosed'))
    return `${did}. Another Nuskho window on this computer is holding the records. `
      + 'Close every other Nuskho tab, then reload this page. Nothing has been lost.'

  // Private browsing, or a browser configured with storage switched off. There
  // is nothing to retry here: it will fail identically every time.
  if (has('MissingAPI', 'InvalidStateError', 'SecurityError', 'not supported', 'indexedDB'))
    return `${did}, because this browser will not let Nuskho keep records. `
      + 'It is usually a private or incognito window. Open Nuskho in a normal window. '
      + 'Use the paper pad until then.'

  // Two writes raced for the same number. Rare, and it fixes itself.
  if (has('ConstraintError'))
    return `${did}, because that number was taken at the same moment somewhere else. `
      + 'Press it once more. Nothing has been lost.'

  // Everything else, including the ones nobody has met yet.
  return `${did}, and nothing was lost. Press it once more. `
    + 'If it refuses again, reload the page, and if it still refuses, '
    + 'use the paper pad and take a backup before this computer is switched off.'
}

/* -------------------------------------------------------- the catch-all
 *
 * Everything above only fires where somebody remembered to write a catch. This
 * is for everywhere they did not, and for the failures that happen with no
 * button pressed at all: a promise nobody awaited, a render that threw.
 *
 * It is deliberately quiet about detail and loud about existence. A person
 * seeing this band knows only that something went wrong and the screen may be
 * showing something out of date, which is exactly the true statement, and it
 * is far better than the silence it replaces.
 */

type Watcher = (message: string) => void
const watchers = new Set<Watcher>()

/** Show the band. Returns the unsubscribe, for a React effect. */
export function onFailure(w: Watcher): () => void {
  watchers.add(w)
  arm()
  return () => { watchers.delete(w) }
}

function tell(e: unknown, where: string): void {
  // The console keeps the real thing, with its stack, for whoever is looking.
  console.error('[nuskho] ' + where, e)
  const msg = whyItFailed(e, 'Something on this screen did not finish')
  for (const w of watchers) { try { w(msg) } catch { /* ignore */ } }
}

let armed = false
function arm(): void {
  if (armed || typeof window === 'undefined') return
  armed = true
  // A rejected promise nobody caught. This is what a missing catch in an async
  // click handler becomes, so it is the one that matters most here.
  window.addEventListener('unhandledrejection', ev => {
    tell((ev as PromiseRejectionEvent).reason, 'unhandled rejection')
  })
  // A synchronous throw that escaped. Rarer, and usually fatal to the screen,
  // but a person who can read "reload this page" recovers in five seconds.
  window.addEventListener('error', ev => {
    // Ignore failed images, stylesheets and other resource loads: they fire the
    // same event, they are not failures a person can act on, and a band that
    // appears because an icon was slow is a band people learn to ignore.
    if ((ev as ErrorEvent).error) tell((ev as ErrorEvent).error, 'uncaught error')
  })
}
