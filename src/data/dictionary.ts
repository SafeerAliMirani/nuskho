import type { Form, Route } from '../types'
import { FORM_LABEL } from './forms'
import { PK_MEDS } from './pk'

/**
 * The shelf a doctor reaches into.
 *
 * This is a QUARRY, not a prescription. Nothing here is on anybody's list. The
 * doctor pulls an entry out of it and from that moment it is his: a copy, not a
 * live reference, so a later change to the shelf can never silently rewrite a
 * medicine he has already reviewed and prescribed.
 *
 * THE RULE THAT BOUNDS THIS FILE, RESTATED AFTER IT WAS TESTED.
 *
 * It used to say: an entry may only be added after a person at Nuskho has
 * checked it by hand, the brand, the strength, the form AND the Sindhi, which
 * is why there is no bulk import from anywhere. A national list is thirty
 * thousand rows nobody has verified sitting one tap from a printed slip.
 *
 * That is still the rule about what may be CLAIMED. What it turned out not to
 * be is a rule about how many rows there may be. Eight rows was not caution, it
 * was a doctor typing every medicine by hand at nine at night, which is where
 * wrong spellings actually come from. See pk.ts: 249 Pakistani brands, each
 * claiming only what is printed on the box, and claiming no Sindhi at all. The
 * Sindhi that reaches paper is the form and timing vocabulary, which is a
 * closed set and has been read. So the shelf got two hundred rows longer
 * without a single unreviewed Sindhi word getting nearer to a patient.
 *
 * A Sindhi name can still be added to any row, one at a time, through the same
 * gate as everything else. `sd` is what a person wrote and `verified` is who.
 */
export interface DictEntry {
  brand: string
  strength: string
  form: Form
  generic: string
  /** read and confirmed by someone who reads Sindhi. Blank means not yet done. */
  sd: string
  /** who checked it and when, so a wrong entry can be traced back to a person */
  verified: string
  /** where it goes, for the forms where it can differ. Absent means by mouth. */
  route?: Route
  /** what it is for, so "cough" finds the cough medicines. Never printed. */
  cls?: string
  /** who makes it. Never printed: it separates two rows that read alike. */
  maker?: string
  /** the strength was not found on a box we trusted, so none is claimed */
  check?: boolean
}

/**
 * THE SHELF ITSELF.
 *
 * Built from pk.ts rather than typed out again here, because a medicine list
 * kept in two files is a medicine list that disagrees with itself. Every `sd`
 * is empty on purpose: see the long note at the top of pk.ts.
 */
export const dictionary: DictEntry[] = PK_MEDS.map(m => ({
  brand: m.brand, strength: m.strength, form: m.form, generic: m.generic,
  sd: '', verified: 'pk-2026-08', route: m.route, cls: m.cls, maker: m.maker,
  check: m.check,
}))

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * Prefix match on the brand or the generic. Deliberately not fuzzy: a fuzzy
 * match over look-alike brand names is how the wrong strength gets picked.
 *
 * The class is searched too, and only as a whole word from the start, so
 * "antib" reaches the antibiotics on an evening when he cannot remember which
 * brand he wanted. It is ranked below the brand and the generic because a
 * doctor typing letters is nearly always typing a name.
 */
export function searchDictionary(q: string, limit = 10): DictEntry[] {
  const k = norm(q)
  if (k.length < 2) return []
  const hit = (e: DictEntry) => norm(e.brand).startsWith(k) || norm(e.generic).startsWith(k)
  const loose = (e: DictEntry) => norm(e.brand).includes(k) || norm(e.generic).includes(k)
  const kind = (e: DictEntry) => norm(e.cls ?? '').startsWith(k)
  const first = dictionary.filter(hit)
  const rest = dictionary.filter(e => !hit(e) && loose(e))
  const byKind = dictionary.filter(e => !hit(e) && !loose(e) && kind(e))
  return [...first, ...rest, ...byKind].slice(0, limit)
}

/** What a row shows. The disambiguator is text, not a picture: two look-alike
 *  brands always differ visibly here, and this never goes stale. */
export const dictLine = (e: DictEntry) =>
  [e.brand, e.strength, FORM_LABEL[e.form].toLowerCase(), e.generic]
    .filter(Boolean).join(' · ')
