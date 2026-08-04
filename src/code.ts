/**
 * The number on the slip, and the check digit that stops it opening the wrong
 * patient's history.
 *
 * Its own file so it can be tested without a browser: db.ts opens IndexedDB at
 * import time, and this is the one piece of logic where being wrong is a
 * patient-safety problem rather than an inconvenience.
 */

/* ------------------------------------------------------------- patient code
   Four digits plus a Luhn check digit. The check digit is the point: a
   mistyped number fails loudly instead of quietly opening the wrong patient's
   history in front of a doctor who is trusting the screen. */

function luhn(d: string): number {
  let sum = 0, dbl = true
  for (let i = d.length - 1; i >= 0; i--) {
    let n = d.charCodeAt(i) - 48
    if (dbl) { n *= 2; if (n > 9) n -= 9 }
    sum += n; dbl = !dbl
  }
  return (10 - (sum % 10)) % 10
}

export function patientCode(num: number): string {
  const b = String(num).padStart(4, '0')
  return b + luhn(b)
}

/**
 * Returns the patient number, or null if the code is malformed or mistyped.
 *
 * THIS USED TO DEMAND EXACTLY FIVE DIGITS, AND THAT WAS A TIME BOMB.
 *
 * padStart(4) is a floor, not a ceiling: patient 10000 gets a five-digit body
 * and a six-character code. The old check — `c.length !== 5` — returned null
 * for every one of them. So on the evening the clinic registered its ten
 * thousandth patient, every new slip carried a number and a QR square that the
 * clinic's own desk could no longer resolve. Not with an error: findByCode
 * simply returned undefined, so the compounder would register the same person
 * again as new, and the doctor would open a patient with no history while
 * trusting the screen to show him one. That is how the wrong prescription
 * reaches somebody who cannot read the slip.
 *
 * At the ~140 patients an evening this app is built for, that is roughly month
 * seven. bumpHighWaterPastRestore adds 50 on every restore, which pulls it
 * closer.
 *
 * So the width is no longer fixed. The check digit is always the last
 * character and the body is everything before it, which makes every width
 * unambiguous and keeps every slip already in a drawer valid — a four-digit
 * body still produces exactly the code it produced before.
 */
export function parseCode(code: string): number | null {
  const c = code.replace(/\D/g, '')
  if (c.length < 5) return null           // 4-digit body + check is the smallest
  const b = c.slice(0, -1)
  if (luhn(b) !== Number(c[c.length - 1])) return null
  return Number(b)
}

/** The length of a code for a given number — what the Open button waits for. */
export const codeLength = (num: number): number => Math.max(4, String(num).length) + 1
