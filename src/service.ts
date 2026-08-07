/**
 * THE LICENCE, AND THE FOUR RULES IT IS BUILT UNDER.
 *
 * Safeer's words, after being talked out of it twice and coming back a third
 * time: "I dont want someone use my app without payment." It is his product
 * and his living, and licensed software that stops when it is not paid for is
 * an ordinary thing that thousands of products do. So Nuskho does it.
 *
 * But this is the software a doctor prints a prescription from, so it is built
 * under four rules that are not negotiable and must survive every future edit:
 *
 *   1. IT IS DECIDED WHEN THE APP OPENS, AND NEVER AGAIN. `frozen()` is read
 *      once at mount and never re-read. A clinic that is working at 7pm keeps
 *      working until somebody closes the app, however long the evening runs.
 *      Nothing here may ever be put inside a timer or a render loop.
 *
 *   2. THE RECORDS ARE NEVER HELD. Even frozen, the doctor can save a full
 *      backup and walk away with every patient. Withholding software is a
 *      commercial act. Withholding a clinic's medical records is a different
 *      thing entirely, in law and in the eyes of anyone who hears about it.
 *
 *   3. IT IS UNDONE BY A CODE READ DOWN A PHONE, offline, in thirty seconds.
 *      There is no server, so a freeze that needed one to lift would mean a
 *      four hour drive every time a payment lands late.
 *
 *   4. A WRONG CLOCK MUST NOT FREEZE ANYBODY. A clinic laptop with a flat CMOS
 *      battery thinks it is 2009 or 2038, so the clock is checked against the
 *      newest moment the app has honestly been open at, and an impossible jump
 *      forward is not believed. It fails open, on purpose.
 *
 * And it is honest about what it is. `paidUntil` blank means no licence at all
 * and nothing here ever runs, which is the right setting for a pilot clinic.
 * The website and the Service Agreement say plainly that Nuskho is licensed,
 * because software that stops must never be sold as software that cannot.
 */

const KEY = 'nuskho.service'
const SNOOZE = 'nuskho.service.snooze'
const SEEN = 'nuskho.service.seen'

export type Service = {
  /** 'YYYY-MM-DD'. The day the money was due. Empty means no licence, ever. */
  paidUntil: string
  /** Days after that before the app stops. 0 disables the stop entirely. */
  graceDays: number
  /** what is due, in rupees. 0 shows no figure rather than "Rs 0". */
  amount: number
  /** who to ring. Falls back to the number on the website. */
  contact: string
  /** the clinic's own short code, printed on its setup sheet. Part of the key. */
  clinic: string
}

const BLANK: Service = { paidUntil: '', graceDays: 14, amount: 0, contact: '', clinic: '' }

export function service(): Service {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return BLANK
    const v = JSON.parse(raw) as Partial<Service>
    return {
      paidUntil: typeof v.paidUntil === 'string' ? v.paidUntil : '',
      graceDays: Number.isFinite(Number(v.graceDays)) ? Math.max(0, Math.floor(Number(v.graceDays))) : 14,
      amount: Number(v.amount) || 0,
      contact: typeof v.contact === 'string' ? v.contact : '',
      clinic: typeof v.clinic === 'string' ? v.clinic : '',
    }
  } catch { return BLANK }
}

export function setService(s: Service): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); localStorage.removeItem(SNOOZE) }
  catch { /* a clinic with storage full has bigger problems than a licence */ }
}

/* --------------------------------------------------------------------- dates */

const DAY = 86400000

/** Midnight local time on a 'YYYY-MM-DD', or null if it is not a real date. */
const dayStart = (iso: string): number | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return null
  const t = new Date(+m[1], +m[2] - 1, +m[3]).getTime()
  return isNaN(t) ? null : t
}

export const isoDay = (t: number): string => {
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * RULE 4, AND IT DELIBERATELY FAILS OPEN.
 *
 * A clinic laptop's clock is not evidence. A flat CMOS battery puts it in 2038
 * or in 2000, a BIOS reset moves it by years, and somebody who does not want to
 * pay can simply wind it back. So the app keeps the newest moment it has ever
 * honestly been open at, and reads the clock against it:
 *
 *   wound BACKWARDS   the high-water mark wins, so winding the clock back does
 *                     not lift a stop that had already begun
 *   jumped FORWARD    by more than a year between two opens, which no working
 *                     clinic ever does, the clock is not believed at all and
 *                     nothing freezes on this open
 *
 * The second one costs Safeer the rare clinic that genuinely did not open
 * Nuskho for over a year and is also overdue. That is the right way round to be
 * wrong: a clinic wrongly left working is a phone call, a clinic wrongly
 * stopped with patients waiting is the end of a reputation.
 */
const IMPLAUSIBLE = 400 * DAY

function clockNow(now: number): number {
  try {
    const last = Number(localStorage.getItem(SEEN) || 0)
    if (!last) { localStorage.setItem(SEEN, String(now)); return now }
    if (now - last > IMPLAUSIBLE) return last   // not believed, and not recorded
    const at = Math.max(now, last)
    localStorage.setItem(SEEN, String(at))
    return at
  } catch { return now }
}

/** Days past the due date. Negative means days still to run. null means no licence. */
export function daysOverdue(now = Date.now()): number | null {
  const due = dayStart(service().paidUntil)
  if (due === null) return null
  return Math.floor((now - due) / DAY)
}

/* ------------------------------------------------------------------- the stop */

/**
 * Is this clinic past the end of its grace period?
 *
 * Read ONCE, at app open. See rule 1, and clockNow above for rule 4.
 */
export function frozen(now = Date.now()): boolean {
  const s = service()
  const due = dayStart(s.paidUntil)
  if (due === null) return false          // no licence set: nothing ever stops
  if (s.graceDays <= 0) return false      // grace of zero switches the stop off
  const deadline = due + s.graceDays * DAY
  return clockNow(now) >= deadline
}

/** What the frozen screen says: how long, how much, who to call. */
export function freezeFacts(now = Date.now()) {
  const s = service()
  const due = dayStart(s.paidUntil) ?? now
  return {
    since: isoDay(due + s.graceDays * DAY),
    days: Math.max(0, Math.floor((now - (due + s.graceDays * DAY)) / DAY)),
    amount: s.amount,
    contact: s.contact || '0333 3368189',
    clinic: s.clinic,
  }
}

/* ------------------------------------------------------- the code on the phone */

/**
 * An offline unlock code, and an honest word about what it is worth.
 *
 * The check happens on the clinic's own machine, so the rule that makes a code
 * valid is inside the app that anybody can read. Somebody technical enough can
 * always pick an offline lock; that is true of every product that has ever
 * shipped one. This stops a clinic from drifting into not paying. It does not
 * stop a determined thief, and it must never be sold as if it does.
 *
 * The code binds to the clinic's own code, so one clinic's key does not unlock
 * another, and to the new date, so a code cannot be reused next month.
 */
const SALT = 'nuskho.licence.v1'

const digitsFrom = (s: string, n: number): string => {
  // A small, dependency-free hash. It is a checksum, not a cipher, and it is
  // written that way on purpose so nobody mistakes it for one.
  let h1 = 0x811c9dc5, h2 = 0x01000193
  for (let i = 0; i < s.length; i++) {
    h1 = Math.imul(h1 ^ s.charCodeAt(i), 0x01000193) >>> 0
    h2 = Math.imul(h2 + s.charCodeAt(i) * (i + 7), 0x85ebca6b) >>> 0
  }
  const big = (h1 >>> 0).toString().padStart(10, '0') + (h2 >>> 0).toString().padStart(10, '0')
  return big.slice(0, n)
}

const norm = (s: string) => s.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')

/** The code Nuskho reads down the phone. Twelve digits, in threes. */
export function makeCode(clinic: string, newPaidUntil: string): string {
  const raw = digitsFrom(`${SALT}|${norm(clinic)}|${newPaidUntil.trim()}`, 12)
  return raw.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3')
}

/**
 * Try a code the clinic typed. On success the licence is extended and the app
 * is unfrozen on the next open. Returns the new date, or null.
 *
 * Because the code carries the date, one code moves the clinic to exactly the
 * day Safeer intended and no further.
 */
export function tryCode(typed: string, candidates: string[]): string | null {
  const s = service()
  const want = norm(typed)
  for (const day of candidates) {
    if (norm(makeCode(s.clinic, day)) === want) {
      setService({ ...s, paidUntil: day })
      return day
    }
  }
  return null
}

/**
 * Every date a code could reasonably be for: today and the next two years, day
 * by day. Cheap enough to run on a click, and it means the clinic types one
 * number and nothing else.
 */
export function candidateDays(now = Date.now()): string[] {
  const out: string[] = []
  for (let i = 0; i <= 760; i++) out.push(isoDay(now + i * DAY))
  return out
}

/* --------------------------------------------------------------- the reminder */

export function snoozed(now = Date.now()): boolean {
  try {
    const t = Number(localStorage.getItem(SNOOZE) || 0)
    return t > 0 && now - t < DAY
  } catch { return false }
}

export function snooze(now = Date.now()): void {
  try { localStorage.setItem(SNOOZE, String(now)) } catch { /* ignore */ }
}

export type Nag = {
  tone: 'soon' | 'due'; days: number; amount: number; contact: string
  on: string; stopsOn: string; stopsIn: number
}

/**
 * What to put in front of the person who pays.
 *
 * From seven days before, so a renewal is never a surprise. Every evening once
 * it is late, and from then on it also says the date the app will stop, because
 * a stop nobody was warned about is the one that costs a customer.
 */
export function nag(now = Date.now()): Nag | null {
  const d = daysOverdue(now)
  if (d === null) return null
  if (d < -7) return null
  if (snoozed(now)) return null
  const s = service()
  const due = dayStart(s.paidUntil)!
  const stop = due + s.graceDays * DAY
  return {
    tone: d < 0 ? 'soon' : 'due',
    days: Math.abs(d),
    amount: s.amount,
    contact: s.contact || '0333 3368189',
    on: s.paidUntil,
    stopsOn: isoDay(stop),
    stopsIn: s.graceDays > 0 ? Math.max(0, Math.ceil((stop - now) / DAY)) : -1,
  }
}
