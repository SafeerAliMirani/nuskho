import type { Visit } from './types'

/**
 * DIAGNOSES: SEVERAL PER VISIT, AND THE SINDHI GATE THAT GUARDS THEM.
 *
 * A visit held exactly one diagnosis, which is not how a consultation in
 * Larkana ends. A woman comes in with anaemia AND a urinary infection; a man
 * has diabetes AND a chest infection, and the chest infection is why he is
 * here today while the diabetes is why the antibiotic choice matters. The
 * doctor had to pick the one he minded most and drop the other, and the slip
 * said one thing where he had found two.
 *
 * HOW IT IS STORED, AND WHY THERE ARE TWO FIELDS FOR ONE FACT
 *
 * Every visit already in every clinic's database has `diagnosis`, a string.
 * Rewriting those on upgrade would mean a migration that touches the whole
 * history of a practice to gain nothing, and a migration that half-runs on a
 * machine somebody switched off is the one class of bug this app cannot
 * recover from. So `diagnoses` is the new field, `diagnosis` is never written
 * again, and every reader goes through `dxList` — exactly the arrangement
 * `dose.e` and `RxSnap` already use. Absent means "look at the old field".
 *
 * THE SINDHI IS NOT THE SINDHI ALREADY IN THE FILE
 *
 * specialty.ts carries a Sindhi word for all 114 diagnoses it seeds. Not one
 * of them has ever printed, and that was not an oversight: they are our
 * guesses, and the rule this whole app is built on is that a machine's guess
 * at Sindhi does not reach paper. Safeer reviewed 26 of them, in writing, on
 * 20 Aug 2026 (see sindhi-to-translate.md), and his wording differs from the
 * file's in most cases — his "تپ (بخار)" against the file's bare "بخار".
 *
 * So REVIEWED below is the only Sindhi that prints, his words exactly. A
 * diagnosis that is not in it prints in English alone, the same way a
 * medicine with `sdReviewed` unticked does. The screen may still show the
 * unreviewed word, because a doctor reading his own chip list is not a
 * patient being handed a piece of paper.
 *
 * Pure: no storage, no React, no print.
 */

/**
 * How many a slip will carry. Not a database limit — a paper one, and a
 * clinical one. Four things found is a consultation; eight is a list somebody
 * pasted, and by then the doctor has stopped telling the chemist what matters
 * and started telling him everything.
 */
export const MAX_DX = 4

/**
 * SAFEER'S OWN WORDS, reviewed 20 Aug 2026. Nothing is added here without a
 * person reading it first, and "a person" does not mean a translation engine
 * and does not mean us. If a diagnosis is missing from this map the slip
 * prints English, which is correct and safe, and the fix is a review session
 * rather than a commit.
 */
export const REVIEWED: Record<string, string> = {
  'Fever': 'تپ (بخار)',
  'Chest infection': 'سيني جو انفيڪشن',
  'Gastritis': 'معدي جي سوزش / گيسٽرائٽس',
  'High blood pressure': 'هاءِ بلڊ پريشر (رت جو تيز داٻ)',
  'Diabetes': 'شوگر (ذیابيطس)',
  'Diarrhoea': 'دست (ڊائرريا)',
  'Body ache': 'بدن جو سور',
  'Upper respiratory infection': 'نڙيءَ ۽ ساهه جي مٿئين حصي جو انفيڪشن',
  'Anaemia': 'رت جي کوٽ (انيما)',
  'Urinary tract infection': 'پيشاب جي ناليءَ جو انفيڪشن (UTI)',
  'Acidity / GERD': 'معدي جي تيزابيت / گيسٽرڪ ريفلڪس',
  'Allergy': 'الرجي',
  'Weakness': 'ڪمزوري',
  'Backache': 'چيلهه جو سور',
  'Headache': 'مٿي جو سور',
  'Joint pain': 'سنڌن جو سور',
  'Asthma': 'دمو (ساهه جي بيماري)',
  'Skin infection': 'چمڙيءَ جو انفيڪشن',
  'Worm infestation': 'پيٽ جا ڪينئان (جيت)',
  'Menstrual pain': 'ماهواريءَ جو سور',
  'Irregular periods': 'ماهواريءَ جي بي ترتيبي',
  'PCOS': 'پي سي او ايس (بيضا دانين ۾ ڳوڙهيون)',
  'Infertility': 'اولاد نه ٿيڻ (بانجهه پڻو)',
  'Pregnancy': 'حمل (اميدواري)',
  'Threatened miscarriage': 'حمل ضايع ٿيڻ جو خطرو',
  'Hypothyroidism': 'ٿائرائڊ جي گهٽتائي (هائپوٿائرائڊزم)',
}

/** The reviewed Sindhi for a diagnosis, or '' — which means print English.
 *  Never falls back to the unreviewed word in specialty.ts. */
export const dxSd = (en: string): string => REVIEWED[en.trim()] ?? ''

/** Every diagnosis on this visit, new field first, old field as one item. */
export function dxList(v: Pick<Visit, 'diagnoses' | 'diagnosis'>): string[] {
  if (v.diagnoses) return v.diagnoses
  const one = (v.diagnosis ?? '').trim()
  return one ? [one] : []
}

/** English, joined, for the one-line places: the queue, the figures, the
 *  card the next doctor reads. Never printed on the slip, which lays them
 *  out itself. */
export const dxText = (v: Pick<Visit, 'diagnoses' | 'diagnosis'>): string =>
  dxList(v).join(', ')

/** Trimmed, de-duplicated case-insensitively, capped, in the order picked.
 *  The order is the doctor's: the first one is what he is treating today. */
export function cleanDx(list: readonly string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of list) {
    const d = String(raw ?? '').replace(/\s+/g, ' ').trim().slice(0, 60)
    if (!d) continue
    const k = d.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(d)
    if (out.length >= MAX_DX) break
  }
  return out
}

/**
 * The patch that stores a new set. It CLEARS the old single field in the same
 * write: leaving it behind would mean a visit whose two fields disagree, and
 * the next reader to forget `dxList` would print the stale one.
 */
export const dxPatch = (list: readonly string[]) => {
  const d = cleanDx(list)
  return { diagnoses: d.length ? d : undefined, diagnosis: undefined }
}

/** Adding one to what is there, or taking it off again if it is already on.
 *  Answers null when the list is full and this would be the fifth, so the
 *  screen can say so rather than silently dropping the tap. */
export function toggleDx(v: Pick<Visit, 'diagnoses' | 'diagnosis'>, one: string): string[] | null {
  const now = dxList(v)
  const k = one.trim().toLowerCase()
  const had = now.some(d => d.toLowerCase() === k)
  if (had) return now.filter(d => d.toLowerCase() !== k)
  if (now.length >= MAX_DX) return null
  return cleanDx([...now, one])
}

export const hasDx = (v: Pick<Visit, 'diagnoses' | 'diagnosis'>, one: string): boolean =>
  dxList(v).some(d => d.toLowerCase() === one.trim().toLowerCase())
