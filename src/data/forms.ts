import type { Form, Route } from '../types'

/**
 * THE WORDS AND THE PICTURES FOR EVERY FORM THAT IS NOT A PILL.
 *
 * One file, because a form word that is decided in two places is a form word
 * that disagrees with itself on paper.
 *
 * NOTHING HERE PRINTS ITS SINDHI UNTIL A PERSON HAS READ IT. That is the same
 * rule the medicine names already obey through `sdReviewed`, and it exists for
 * the same reason: this project cannot put a word on a medical document that
 * nobody who speaks the language has looked at. The Sindhi below is a
 * SUGGESTION. Until it is ticked in Setup, Review, the slip prints the English
 * and the pictogram, which is safe and still readable — the pictogram is the
 * part the patient who cannot read depends on anyway.
 *
 * The four words that were already on paper before this file existed — گوري,
 * ڪيپسول, سيرپ, چمچو — ship as read, because they have been printed and
 * checked since the first sheet.
 */

export type Word = {
  en: string
  sd: string
  /** a person has read the Sindhi. Until then only the English prints. */
  ok: boolean
}

const KEY = 'nuskho.words'

/** What is in the box. Printed after the Sindhi brand name. */
export const FORM_WORD: Record<Form, Word> = {
  tab: { en: 'tablet', sd: 'گوري', ok: true },
  cap: { en: 'capsule', sd: 'ڪيپسول', ok: true },
  syr: { en: 'syrup', sd: 'سيرپ', ok: true },
  drop: { en: 'drops', sd: 'قطرا', ok: false },
  cream: { en: 'cream', sd: 'ڪريم', ok: false },
  sachet: { en: 'sachet', sd: 'ساشي', ok: false },
  // Deliberately blank. An `other` is an inhaler, a suppository, a patch, a
  // pessary or something nobody here has thought of, and naming it دوا told
  // the patient nothing while looking like it had. The doctor's own written
  // note carries these, which is what happens today on a paper pad.
  other: { en: '', sd: '', ok: true },
}

/** What the patient picks up, printed in the morning, midday and night cells. */
export const DOSE_WORD: Record<Form, Word> = {
  tab: { en: 'tablet', sd: 'گوري', ok: true },
  cap: { en: 'capsule', sd: 'ڪيپسول', ok: true },
  syr: { en: 'spoon', sd: 'چمچو', ok: true },
  drop: { en: 'drops', sd: 'قطرا', ok: false },
  cream: { en: 'apply', sd: 'لڳايو', ok: false },
  sachet: { en: 'sachet', sd: 'ساشي', ok: false },
  other: { en: '', sd: '', ok: true },
}

/**
 * WHERE IT GOES, for the cell that would otherwise say "after food".
 *
 * An eye drop taken after food is a sentence with no meaning in it, and worse,
 * a plate pictogram beside an eye drop is a picture of the wrong thing. So for
 * a route that is not the mouth, that cell carries the site instead.
 */
export const ROUTE_WORD: Record<Route, Word> = {
  mouth: { en: '', sd: '', ok: true },
  eye: { en: 'in both eyes', sd: 'ٻنهي اکين ۾', ok: false },
  ear: { en: 'in both ears', sd: 'ٻنهي ڪنن ۾', ok: false },
  nose: { en: 'in the nose', sd: 'نڪ ۾', ok: false },
  skin: { en: 'on the skin', sd: 'چمڙيءَ تي', ok: false },
}

/* --------------------------------------------------- what has been read yet */

/**
 * Which of the suggestions above a person has approved, kept beside the
 * letterhead and the medicine list, on the clinic's own machine. A word is
 * approved once and stays approved; the list is small and never grows on its
 * own.
 */
function approved(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return new Set(Array.isArray(raw) ? raw.map(String) : [])
  } catch { return new Set() }
}

export function wordOk(key: string, w: Word): boolean {
  return w.ok || approved().has(key)
}

export function setWordOk(key: string, on: boolean): void {
  const s = approved()
  on ? s.add(key) : s.delete(key)
  try { localStorage.setItem(KEY, JSON.stringify([...s])) } catch { /* private mode */ }
}

/** Everything a person could still be asked to read, for the Review tab. */
export function pendingWords(): { key: string; en: string; sd: string; ok: boolean }[] {
  const out: { key: string; en: string; sd: string; ok: boolean }[] = []
  const push = (key: string, w: Word) => {
    if (!w.sd || w.ok) return
    if (out.some(x => x.sd === w.sd)) return       // one row per word, not per use
    out.push({ key, en: w.en, sd: w.sd, ok: wordOk(key, w) })
  }
  for (const [f, w] of Object.entries(FORM_WORD)) push('form:' + f, w)
  for (const [f, w] of Object.entries(DOSE_WORD)) push('dose:' + f, w)
  for (const [r, w] of Object.entries(ROUTE_WORD)) push('route:' + r, w)
  return out
}

/* ------------------------------------------------------------ what prints */

/** The Sindhi for this word if a person has read it, otherwise nothing. */
const sdOf = (key: string, w: Word): string => (wordOk(key, w) ? w.sd : '')

export const formSdFor = (f: Form): string => sdOf('form:' + f, FORM_WORD[f] ?? FORM_WORD.other)
export const formEnFor = (f: Form): string => (FORM_WORD[f] ?? FORM_WORD.other).en
export const doseSdFor = (f: Form): string => sdOf('dose:' + f, DOSE_WORD[f] ?? DOSE_WORD.other)
export const doseEnFor = (f: Form): string => (DOSE_WORD[f] ?? DOSE_WORD.other).en
export const routeSdFor = (r: Route): string => sdOf('route:' + r, ROUTE_WORD[r] ?? ROUTE_WORD.mouth)

/**
 * The English dose word, made to agree with the number beside it.
 *
 * "1 drops" is the sort of thing that makes a doctor decide the software was
 * written by someone who has never seen a prescription, and he would be right.
 * Only the English needs this; the Sindhi words here do not inflect for one.
 */
export const doseEnFor1 = (f: Form, n: number): string => {
  const w = doseEnFor(f)
  if (!w || n !== 1) return w
  return w === 'drops' ? 'drop' : w === 'sachets' ? 'sachet' : w
}
export const routeEnFor = (r: Route): string => (ROUTE_WORD[r] ?? ROUTE_WORD.mouth).en

/** Forms a doctor picks from, in the order a clinic meets them. */
export const FORMS: Form[] = ['tab', 'cap', 'syr', 'drop', 'cream', 'sachet', 'other']

export const FORM_LABEL: Record<Form, string> = {
  tab: 'Tablet', cap: 'Capsule', syr: 'Syrup', drop: 'Drops',
  cream: 'Cream or ointment', sachet: 'Sachet', other: 'Something else',
}

/** Routes worth asking about, and only for the forms where it can differ. */
export const ROUTES: Route[] = ['mouth', 'eye', 'ear', 'nose', 'skin']

export const ROUTE_LABEL: Record<Route, string> = {
  mouth: 'By mouth', eye: 'Eye', ear: 'Ear', nose: 'Nose', skin: 'On the skin',
}

/** Does asking about the site make sense for this form? */
export const routeMatters = (f: Form): boolean => f === 'drop' || f === 'cream' || f === 'other'

/** The site a form defaults to when nobody has said. */
export const defaultRoute = (f: Form): Route => (f === 'cream' ? 'skin' : 'mouth')

/** Is this line dosed as a countable number the patient can see? A cream is
 *  not: "1.5 creams" is not a thing, and printing a half circle beside it
 *  would be a picture of a tablet cut in two. */
export const countable = (f: Form): boolean =>
  f === 'tab' || f === 'cap' || f === 'syr' || f === 'drop' || f === 'sachet'
