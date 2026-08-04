/**
 * Stamped at build time by vite.config.ts.
 *
 * It matters because the first question about any bug in a clinic is "which
 * copy of the app is on that machine", and the answer must not depend on
 * somebody remembering which zip they unpacked in June.
 */
export const VERSION: string = __NK_VERSION__
export const BUILT: string = __NK_BUILT__

/** The exact commit. Two builds numbered 1.0.0 are not the same software. */
export const BUILD: string = __NK_BUILD__

/**
 * WHAT THIS COPY IS FOR.
 *
 * `clinic` — a real clinic. Records are real, printing is real, and nothing
 *            here updates itself: it changes when a person carries a new
 *            folder to the machine and not one moment sooner.
 *
 * `demo`   — the public copy, for showing people. It rebuilds on every push,
 *            so it must never hold a real patient: everything it prints is
 *            watermarked, its records are wiped, and it cannot export.
 *
 * This distinction is the whole reason a six-week pilot can mean anything. A
 * clinic that silently receives the features written during week three is not
 * a clinic anybody measured.
 */
export type Channel = 'clinic' | 'demo'
export const CHANNEL: Channel = __NK_CHANNEL__ as Channel

/** Read this rather than comparing strings; it is checked in several places. */
export const isDemo = CHANNEL === 'demo'

/** One line for a screen or a bug report: `1.0.0 · a4f19c3 · clinic`. */
export const stamp = (): string => `${VERSION} · ${BUILD} · ${CHANNEL}`
