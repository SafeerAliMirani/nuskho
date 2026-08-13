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
 *
 * READ BY SAFEER ON 7 AUG 2026 and confirmed correct: قطرا, ڪريم, ساشي, لڳايو,
 * شام, and the four sites ٻنهي اکين ۾, ٻنهي ڪنن ۾, نڪ ۾, چمڙيءَ تي.
 *
 * READ BY SAFEER ON 8 AUG 2026, thirteen more, with the three forms that used
 * to hide under `other` and the sides that an eye drop could never say:
 * ساهه واري دوا, شافو, چمڙيءَ جي پٽي, ڦوڪ, پٽي, ساهه سان اندر ڇڪيو,
 * ساڄي اک ۾, کاٻي اک ۾, ساڄي ڪن ۾, کاٻي ڪن ۾, and وات ۾ نه, which he wrote
 * himself for the suppository and the pessary after rejecting my polite
 * euphemism for one that names no part of the body at all.
 *
 * All of them ship as read, in the source and not in one machine's
 * localStorage, for the reason who.ts gives about the formula column: a word
 * checked once should be checked forever, for every clinic, and not asked
 * again of every doctor who installs this.
 *
 * The gate stays. The NEXT word added to this file ships `ok: false` and prints
 * its English until somebody who speaks Sindhi has looked at it, and a test
 * below fails until that happens, by name, so it cannot be forgotten.
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
  drop: { en: 'drops', sd: 'قطرا', ok: true },
  cream: { en: 'cream', sd: 'ڪريم', ok: true },
  sachet: { en: 'sachet', sd: 'ساشي', ok: true },
  /**
   * THE THREE THAT USED TO HIDE UNDER `other`.
   *
   * `other` printed no word and no picture, on purpose, because a wrong
   * picture is a patient swallowing the wrong thing. That was the right
   * refusal and it was never meant to be permanent: the commonest `other` in a
   * Pakistani clinic is an inhaler, and an inhaler that prints nothing tells a
   * patient who cannot read absolutely nothing about the one medicine on his
   * slip that he has to be taught to use.
   *
   * All three shipped UNREAD and printed their English for exactly as long as
   * that was true, which is the whole of what the gate is for. Safeer read them
   * on 8 Aug 2026 and confirmed all three, so they print their Sindhi now.
   *
   * His note on ساهه واري دوا is worth keeping, because it explains why this is
   * not a transliteration: it means "breathing medicine", which is how a
   * patient here is actually told what an inhaler is. شافو is the ordinary
   * medical word, and چمڙيءَ جي پٽي is literally the skin's patch.
   */
  inhaler: { en: 'inhaler', sd: 'ساهه واري دوا', ok: true },
  supp: { en: 'suppository', sd: 'شافو', ok: true },
  patch: { en: 'skin patch', sd: 'چمڙيءَ جي پٽي', ok: true },
  // Still deliberately blank, and still needed. An `other` is now a pessary, a
  // nebuliser solution, a mouthwash or something nobody here has thought of.
  // Naming it دوا told the patient nothing while looking like it had.
  other: { en: '', sd: '', ok: true },
}

/** What the patient picks up, printed in the morning, midday and night cells. */
export const DOSE_WORD: Record<Form, Word> = {
  tab: { en: 'tablet', sd: 'گوري', ok: true },
  cap: { en: 'capsule', sd: 'ڪيپسول', ok: true },
  syr: { en: 'spoon', sd: 'چمچو', ok: true },
  drop: { en: 'drops', sd: 'قطرا', ok: true },
  cream: { en: 'apply', sd: 'لڳايو', ok: true },
  sachet: { en: 'sachet', sd: 'ساشي', ok: true },
  // A puff, not an inhaler: what the patient takes is one breath from a device
  // he keeps. Printing "1 inhaler" in a dose cell would read as a whole canister.
  inhaler: { en: 'puff', sd: 'ڦوڪ', ok: true },
  supp: { en: 'suppository', sd: 'شافو', ok: true },
  patch: { en: 'patch', sd: 'پٽي', ok: true },
  other: { en: '', sd: '', ok: true },
}

/**
 * THE TIMES OF DAY, for the column headings and the legend.
 *
 * Morning, midday and night ship as read: they have been on every sheet since
 * the first one and Safeer has checked them. The EVENING is new, so it obeys
 * the rule that everything new obeys. Until a person ticks it in Setup,
 * Review, that column heads with its pictogram and its English only, which is
 * exactly as safe as the other three and only slightly less useful.
 *
 * The pictogram is not gated, and that is the point of the rule rather than an
 * exception to it: a picture of a sun going down is not a claim in a language,
 * and the patient who cannot read is depending on the picture anyway.
 */
export const TIME_WORD: Record<'m' | 'd' | 'e' | 'n', Word> = {
  m: { en: 'morning', sd: 'صبح', ok: true },
  d: { en: 'midday', sd: 'منجهند', ok: true },
  e: { en: 'evening', sd: 'شام', ok: true },
  n: { en: 'night', sd: 'رات', ok: true },
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
  eye: { en: 'in both eyes', sd: 'ٻنهي اکين ۾', ok: true },
  ear: { en: 'in both ears', sd: 'ٻنهي ڪنن ۾', ok: true },
  nose: { en: 'in the nose', sd: 'نڪ ۾', ok: true },
  skin: { en: 'on the skin', sd: 'چمڙيءَ تي', ok: true },
  inhale: { en: 'breathe it in', sd: 'ساهه سان اندر ڇڪيو', ok: true },
  /**
   * SAY WHERE IT MUST NOT GO, AND SAY NOTHING ABOUT WHERE IT DOES.
   *
   * The first version of these two named the site, politely, and Safeer read
   * the polite Sindhi and had to ask me what it meant. That question WAS the
   * test result: if it stopped a Sindhi speaker who already knew what the
   * medicine was, it would stop a mother at a counter, and an instruction that
   * has to be puzzled out is the whole problem on this line.
   *
   * He chose the negative, and gave three reasons that are better than my
   * original ones. It kills the actual hazard, which in an OPD is a parent
   * giving a melting suppository by mouth. It keeps a blunt anatomical word
   * off a paper that gets read aloud by family in a public bazaar. And by
   * saying only what must not happen, it sends the person back to the doctor's
   * own note for what must, which is where that instruction belongs anyway.
   *
   * SO BOTH ROUTES PRINT THE SAME FOUR WORDS, on purpose. The distinction
   * between them survives on the SCREEN, where the doctor picks it and where
   * ROUTE_LABEL still says Back passage or Vaginal, and in the record. It just
   * does not go on the paper, because the paper has one job here.
   *
   * These two ship READ. Safeer wrote them himself on 8 Aug 2026, in this
   * exact form, which is the same standing the nine words of 7 Aug have.
   */
  rectal: { en: 'NOT by mouth', sd: 'وات ۾ نه', ok: true },
  vaginal: { en: 'NOT by mouth', sd: 'وات ۾ نه', ok: true },
}

/**
 * WHICH EYE. WHICH EAR.
 *
 * `ROUTE_WORD.eye` says "in both eyes" and it was the only thing an eye drop
 * could say, so one red eye got a prescription for two. Safeer asked what the
 * app did for one eye and the answer was: the wrong thing, silently, on paper,
 * every time.
 *
 * These are a second axis and not more routes, because the side belongs to
 * this prescription and the route belongs to the medicine. Keyed by both so
 * "right" is never printed on its own: a bare ساڄي on a line whose picture is
 * an eye is still a guess for anybody who cannot read the brand above it.
 *
 * Read and confirmed by Safeer on 8 Aug 2026, which is why they print. He
 * asked for these four ahead of the other seven and he was right to: the
 * pictogram carries only the ONE-versus-BOTH half, one eye drawn for one and
 * two for both, and left against right is an instruction no picture on this
 * sheet can give. Getting it wrong has consequences a drawing cannot warn
 * about.
 */
export const SIDE_WORD: Record<'eyeR' | 'eyeL' | 'earR' | 'earL', Word> = {
  eyeR: { en: 'in the RIGHT eye', sd: 'ساڄي اک ۾', ok: true },
  eyeL: { en: 'in the LEFT eye', sd: 'کاٻي اک ۾', ok: true },
  earR: { en: 'in the RIGHT ear', sd: 'ساڄي ڪن ۾', ok: true },
  earL: { en: 'in the LEFT ear', sd: 'کاٻي ڪن ۾', ok: true },
}

/** Does asking which side make sense at all? Only where there are two of them. */
export const sideMatters = (r?: Route): boolean => r === 'eye' || r === 'ear'

const sideKey = (r: Route, side: 'R' | 'L') =>
  ((r === 'eye' ? 'eye' : 'ear') + side) as 'eyeR' | 'eyeL' | 'earR' | 'earL'

export const sideSdFor = (r: Route, side: 'R' | 'L'): string =>
  sdOf('side:' + sideKey(r, side), SIDE_WORD[sideKey(r, side)])
export const sideEnFor = (r: Route, side: 'R' | 'L'): string => SIDE_WORD[sideKey(r, side)].en

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
  for (const [k, w] of Object.entries(SIDE_WORD)) push('side:' + k, w)
  for (const [t, w] of Object.entries(TIME_WORD)) push('time:' + t, w)
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

export type TimeKey = 'm' | 'd' | 'e' | 'n'
/** The four slots, in the order of the day and the order of the columns. */
export const TIMES: TimeKey[] = ['m', 'd', 'e', 'n']
export const timeSdFor = (t: TimeKey): string => sdOf('time:' + t, TIME_WORD[t])
export const timeEnFor = (t: TimeKey): string => TIME_WORD[t].en

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
  cream: 'Cream or ointment', sachet: 'Sachet',
  inhaler: 'Inhaler', supp: 'Suppository', patch: 'Skin patch',
  other: 'Something else',
}

/** Routes worth asking about, and only for the forms where it can differ. */
export const ROUTES: Route[] = ['mouth', 'eye', 'ear', 'nose', 'skin', 'inhale', 'rectal', 'vaginal']

export const ROUTE_LABEL: Record<Route, string> = {
  mouth: 'By mouth', eye: 'Eye', ear: 'Ear', nose: 'Nose', skin: 'On the skin',
  inhale: 'Breathed in', rectal: 'Back passage', vaginal: 'Vaginal',
}

/**
 * IS THIS EVEN SWALLOWED? The question the meal picture never asked.
 *
 * "After food" was suppressed by the ROUTE alone, so a suppository, a patch or
 * an inhaler that happened to carry no route printed the plate and pill scene,
 * which says swallow this after eating. A medicine typed in by the doctor
 * himself carries no route, so this was not the rare case, it was the common
 * one, and it was worst on the one form that must never be swallowed.
 *
 * The form knows the answer on its own and never needs a route to give it.
 */
export const swallowed = (f: Form): boolean =>
  f === 'tab' || f === 'cap' || f === 'syr' || f === 'drop' || f === 'sachet' || f === 'other'

/** Does asking about the site make sense for this form? */
export const routeMatters = (f: Form): boolean =>
  f === 'drop' || f === 'cream' || f === 'other' || f === 'supp'

/**
 * WHICH SITES TO OFFER, rather than all eight for everything.
 *
 * A list that offers "in both eyes" for a suppository is a list with a
 * mis-tap in it, and the mis-tap prints. An inhaler and a patch are not asked
 * at all: `routeMatters` is false for both because there is only ever one
 * answer, and asking a question with one answer teaches people to tap without
 * reading.
 */
export const routesFor = (f: Form): Route[] =>
  f === 'supp' ? ['rectal', 'vaginal']
  : f === 'cream' ? ['skin', 'vaginal']
  : f === 'drop' ? ['mouth', 'eye', 'ear', 'nose']
  : ROUTES

/** The site a form defaults to when nobody has said. */
export const defaultRoute = (f: Form): Route =>
  f === 'cream' || f === 'patch' ? 'skin'
  : f === 'inhaler' ? 'inhale'
  // Most suppositories in an outpatient clinic are paracetamol for a child
  // with a fever, so rectal is the safe default and the picker offers the
  // other. A default of `mouth` here would print "after food" on a thing that
  // must never be swallowed.
  : f === 'supp' ? 'rectal'
  : 'mouth'

/** Is this line dosed as a countable number the patient can see? A cream is
 *  not: "1.5 creams" is not a thing, and printing a half circle beside it
 *  would be a picture of a tablet cut in two. */
export const countable = (f: Form): boolean =>
  f === 'tab' || f === 'cap' || f === 'syr' || f === 'drop' || f === 'sachet'
  // Two puffs, two suppositories, one patch: all three are numbers a patient
  // acts on. The inhaler is counted but never DRAWN twice, because two puffs
  // come out of one device and two devices is a different instruction. That
  // separation lives in the dose cell, not here.
  || f === 'inhaler' || f === 'supp' || f === 'patch'
