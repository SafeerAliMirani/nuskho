/**
 * THE PAYMENT REMINDER, AND WHY IT IS ONLY A REMINDER.
 *
 * Safeer's words: "otherwise its liking giving a charity". He is right that a
 * business needs to ask for its money, and the app is the only thing that sees
 * the doctor every single evening.
 *
 * So Nuskho asks. It does not take. Nothing here can stop a prescription, slow
 * an evening, lock a record or reach a patient. There is no expiry check, no
 * licence, no server, no kill switch, and the four promises on the website
 * stay literally true. What this does is put an unmissable line in front of the
 * one person who pays, on the days after the money was due, and nowhere else.
 *
 * WHO SEES IT. The doctor, the clinic admin, and the Nuskho role. Not the token
 * counter, not the compounder, not the pharmacy: they do not pay, they cannot
 * pay, and a bill in their way every evening is just noise that trains everyone
 * to ignore banners. And never, under any circumstances, on a printed slip. A
 * patient's prescription is not an invoice.
 *
 * WHO SETS IT. Nuskho, under the passphrase, at install and at every renewal.
 * The clinic can push it away for the evening but cannot clear it, because a
 * reminder the payer can delete is not a reminder.
 *
 * NOT SET AT ALL MEANS SILENT. A clinic on a free pilot, or a copy on Safeer's
 * own desk, shows nothing whatsoever until somebody has written a date in.
 */

const KEY = 'nuskho.service'
const SNOOZE = 'nuskho.service.snooze'

export type Service = {
  /** 'YYYY-MM-DD'. The day the money was due. Empty means say nothing, ever. */
  paidUntil: string
  /** what is due, in rupees. 0 prints as no figure rather than as "Rs 0". */
  amount: number
  /** who to ring. Falls back to the number on the website if left empty. */
  contact: string
}

const BLANK: Service = { paidUntil: '', amount: 0, contact: '' }

export function service(): Service {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return BLANK
    const v = JSON.parse(raw) as Partial<Service>
    return {
      paidUntil: typeof v.paidUntil === 'string' ? v.paidUntil : '',
      amount: Number(v.amount) || 0,
      contact: typeof v.contact === 'string' ? v.contact : '',
    }
  } catch { return BLANK }
}

export function setService(s: Service): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); localStorage.removeItem(SNOOZE) }
  catch { /* a clinic with storage full has bigger problems than a reminder */ }
}

/** Midnight local time on a 'YYYY-MM-DD', or null if it is not a real date. */
const dayStart = (iso: string): number | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return null
  const t = new Date(+m[1], +m[2] - 1, +m[3]).getTime()
  return isNaN(t) ? null : t
}

const DAY = 86400000

/**
 * How many days past due, or a negative number for days still to run.
 * null means nothing was ever set, so nothing should ever be said.
 */
export function daysOverdue(now = Date.now()): number | null {
  const due = dayStart(service().paidUntil)
  if (due === null) return null
  return Math.floor((now - due) / DAY)
}

/** Pushed away until tomorrow. Deliberately per-day and never permanent. */
export function snoozed(now = Date.now()): boolean {
  try {
    const t = Number(localStorage.getItem(SNOOZE) || 0)
    return t > 0 && now - t < DAY
  } catch { return false }
}

export function snooze(now = Date.now()): void {
  try { localStorage.setItem(SNOOZE, String(now)) } catch { /* ignore */ }
}

export type Nag = { tone: 'soon' | 'due'; days: number; amount: number; contact: string; on: string }

/**
 * What, if anything, to put in front of the person who pays.
 *
 * Seven days before, once, quietly: so a renewal is never a surprise and a
 * doctor who wants to pay early can. From the due day onward, plainly, every
 * evening until it is settled. Snoozing hides it until tomorrow and no longer.
 */
export function nag(now = Date.now()): Nag | null {
  const d = daysOverdue(now)
  if (d === null) return null
  const s = service()
  if (d < -7) return null
  if (snoozed(now)) return null
  return {
    tone: d < 0 ? 'soon' : 'due',
    days: Math.abs(d),
    amount: s.amount,
    contact: s.contact || '0333 3368189',
    on: s.paidUntil,
  }
}
