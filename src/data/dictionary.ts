import type { Form } from '../types'

/**
 * The verified dictionary.
 *
 * This is a QUARRY, not a shelf. Nothing here is prescribable. The doctor pulls
 * an entry out of it into his own list, and from that moment it is his: a copy,
 * not a live reference, so a later dictionary update can never silently rewrite
 * a list he has already reviewed.
 *
 * THE RULE THAT BOUNDS THIS FILE: an entry may only be added after a person at
 * Nuskho has checked it by hand — the brand exists, the strength is real, the
 * form is right, and the Sindhi has been read by someone who reads Sindhi. That
 * is why there is no bulk import from anywhere. A national list is 30,000 rows
 * nobody has verified, sitting one tap from a printed prescription, and the
 * "never print an unreviewed Sindhi name" rule cannot survive it.
 *
 * So the dictionary EARNS entries. Every medicine a doctor types himself is a
 * work item: check it, write the Sindhi, add it here, and the next clinic gets
 * it for free. A few dozen now, a few hundred within months. Never a download.
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
}

/**
 * SEED ONLY. These carry the pilot doctor's own list.
 *
 * Before the pilot: replace this with his real 30-50, verified against his own
 * old prescriptions, with the Sindhi read aloud to someone who speaks it. Do NOT
 * pad it with brands nobody has checked to make the search feel fuller — an
 * unchecked row here is a wrong medicine on a printed slip, and the doctor will
 * not know it came from us.
 */
export const dictionary: DictEntry[] = [
  { brand: 'AUGMENTIN', strength: '625 mg', form: 'tab', generic: 'Amoxicillin + Clavulanic acid', sd: 'اوگمينتن', verified: 'seed' },
  { brand: 'PANADOL',   strength: '500 mg', form: 'tab', generic: 'Paracetamol',   sd: 'پينادول', verified: 'seed' },
  { brand: 'RISEK',     strength: '20 mg',  form: 'cap', generic: 'Omeprazole',    sd: 'رائسيڪ', verified: 'seed' },
  { brand: 'BROFEX',    strength: 'syrup',  form: 'syr', generic: 'Guaifenesin',   sd: 'بروفيڪس', verified: 'seed' },
  { brand: 'FLAGYL',    strength: '400 mg', form: 'tab', generic: 'Metronidazole', sd: 'فليجل',   verified: 'seed' },
  { brand: 'CIPROXIN',  strength: '500 mg', form: 'tab', generic: 'Ciprofloxacin', sd: 'سپروڪسن', verified: 'seed' },
  { brand: 'MOTILIUM',  strength: '10 mg',  form: 'tab', generic: 'Domperidone',   sd: 'موتيليم', verified: 'seed' },
  { brand: 'CALPOL',    strength: 'syrup',  form: 'syr', generic: 'Paracetamol',   sd: 'ڪالپول', verified: 'seed' },
]

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * Prefix match on the brand or the generic. Deliberately not fuzzy: a fuzzy
 * match over look-alike brand names is how the wrong strength gets picked.
 */
export function searchDictionary(q: string, limit = 8): DictEntry[] {
  const k = norm(q)
  if (k.length < 2) return []
  const hit = (e: DictEntry) => norm(e.brand).startsWith(k) || norm(e.generic).startsWith(k)
  const loose = (e: DictEntry) => norm(e.brand).includes(k) || norm(e.generic).includes(k)
  const first = dictionary.filter(hit)
  const rest = dictionary.filter(e => !hit(e) && loose(e))
  return [...first, ...rest].slice(0, limit)
}

/** What a row shows. The disambiguator is text, not a picture: two look-alike
 *  brands always differ visibly here, and this never goes stale. */
export const dictLine = (e: DictEntry) =>
  [e.brand, e.strength, e.form === 'cap' ? 'capsule' : e.form === 'syr' ? 'syrup' : 'tablet', e.generic]
    .filter(Boolean).join(' · ')
