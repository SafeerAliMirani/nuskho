import type { Form, Route } from '../types'
import { FORM_LABEL } from './forms'
import { PK_MEDS, type PkMed } from './pk'
import { PK2_MEDS } from './pk2'

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
 * claiming only what is printed on the box.
 *
 * THE SHELF SHIPPED WITH NO SINDHI AT ALL, and it worked, because the Sindhi
 * that reaches paper is the form and timing vocabulary, which is a closed set
 * and has been read. Every row carries a suggested Sindhi brand name now, and
 * NOTHING about the rule changed: a suggestion arrives on the doctor's list
 * unreviewed, the same as a name he types himself, and the slip prints the
 * Latin brand off the box until somebody in that clinic reads it and ticks it.
 *
 * So the shelf got two hundred rows longer and then got a Sindhi column, and
 * not one unreviewed Sindhi word got nearer to a patient than it was on day
 * one. `sd` is a candidate and `sdReviewed`, on the doctor's own copy, is the
 * verdict. Those two being different fields is the whole safeguard.
 */
export interface DictEntry {
  brand: string
  strength: string
  form: Form
  generic: string
  /** SUGGESTED Sindhi for the brand. A candidate, never a verdict: what makes
   *  it printable is `sdReviewed` on the doctor's own copy, set by a person. */
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
 * Built from pk.ts and pk2.ts rather than typed out again here, because a
 * medicine list kept in two files is a medicine list that disagrees with
 * itself. pk.ts is the 249 rows a person curated by hand; pk2.ts is the 5,331
 * generated from the 11 Aug harvest (see its header). Same rules, one shelf:
 * the hand-curated rows sit first so PANADOL outranks a harvest row when both
 * match, and a brand can only be in one of the two files, which pk2's own
 * test enforces.
 */
const row = (m: PkMed, verified: string): DictEntry => ({
  brand: m.brand, strength: m.strength, form: m.form, generic: m.generic,
  // A SUGGESTION AND NOT A VERDICT, which is what this field has always been.
  // takeFromDictionary copies it onto his medicine with sdReviewed false, so
  // the slip prints the Latin brand off the box until somebody in that clinic
  // reads the Sindhi and ticks it. See the note on `sd` in pk.ts for where
  // these came from and why that matters.
  sd: m.sd, verified, route: m.route, cls: m.cls, maker: m.maker,
  check: m.check,
})

export const dictionary: DictEntry[] = [
  ...PK_MEDS.map(m => row(m, 'pk-2026-08')),
  // The slug names the harvest file the row came out of, so a wrong entry can
  // be traced to the page and the pass that read it, not just to "the import".
  ...PK2_MEDS.map(m => row(m, 'difs-2026-08-' + ((m as PkMed & { src?: string }).src ?? ''))),
]

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * The searchable keys, computed once. With 249 rows it was fine to normalise
 * inside the filter; with five and a half thousand, every keystroke was
 * re-lowercasing sixteen thousand strings on a clinic machine that may be a
 * decade old. Same behaviour, measured once instead of per keypress.
 */
const KEYS = dictionary.map(e => ({
  e, b: norm(e.brand), g: norm(e.generic), c: norm(e.cls ?? ''),
}))

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
  const first: DictEntry[] = [], rest: DictEntry[] = [], byKind: DictEntry[] = []
  for (const { e, b, g, c } of KEYS) {
    if (b.startsWith(k) || g.startsWith(k)) first.push(e)
    else if (b.includes(k) || g.includes(k)) rest.push(e)
    else if (c.startsWith(k)) byKind.push(e)
    // Nothing early-exits on limit here on purpose: prefix hits found late in
    // the list must still outrank loose hits found early, so all three tiers
    // fill before the cut.
  }
  return [...first, ...rest, ...byKind].slice(0, limit)
}

/** What a row shows. The disambiguator is text, not a picture: two look-alike
 *  brands always differ visibly here, and this never goes stale. */
export const dictLine = (e: DictEntry) =>
  [e.brand, e.strength, FORM_LABEL[e.form].toLowerCase(), e.generic]
    .filter(Boolean).join(' · ')
