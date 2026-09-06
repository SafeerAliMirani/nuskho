/**
 * WHAT A PATIENT'S FIELDS MAY CONTAIN, DECIDED ONCE.
 *
 * Three doors take a patient in: the desk screen, the phone's intake box, and
 * the record holder's `addPatient` intent. Each had its own idea of a valid
 * age (the desk refused anything over 120 because "231321" once printed on a
 * real slip; the phone only cut to three digits; the wire only stripped
 * letters), so the same rule held at one door in three. These cleaners are the
 * rule, and every door calls them. Nothing here touches storage.
 */

/** A name: trimmed, inner runs of space collapsed, at most 80 characters. */
export const cleanName = (v: unknown): string =>
  String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, 80)

/** A phone: digits, plus and space only, at most 15 characters. */
export const cleanPhone = (v: unknown): string =>
  String(v ?? '').replace(/[^0-9+ ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 15)

/**
 * An age in years: digits only, nothing above 120. Anything else becomes ''
 * rather than a clipped number, because "1234" cut to "123" is a wrong age
 * that looks like a right one.
 */
export const cleanAge = (v: unknown): string => {
  const d = String(v ?? '').replace(/\D/g, '').slice(0, 3)
  return d && +d <= 120 ? String(+d) : ''
}

/** A city or village: trimmed, at most 40 characters. */
export const cleanCity = (v: unknown): string =>
  String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, 40)

/** Man or woman, or nothing. */
export const cleanSex = (v: unknown): 'M' | 'F' | undefined =>
  v === 'M' || v === 'F' ? v : undefined

/**
 * A number typed into a vitals box: digits and at most one decimal point.
 * "1.2.3" used to be stored and printed as typed. The keystroke filter keeps
 * the first point and drops the rest, so what the box shows is always a
 * number a chemist can read.
 */
export const cleanDecimal = (v: string): string => {
  const s = v.replace(/[^0-9.]/g, '')
  const i = s.indexOf('.')
  return i < 0 ? s : s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '')
}
