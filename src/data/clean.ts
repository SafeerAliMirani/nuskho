import type { Form } from '../types'
import { whoGeneric } from './who'

/**
 * Turning a medical store's own paperwork into catalogue rows.
 *
 * WHY THIS FILE EXISTS
 *
 * The brand list was never going to come from a website. It comes from the
 * shop: a stock register, a distributor's price list, a month of purchase
 * invoices. That paperwork is current, it is exactly what Larkana actually
 * stocks, and it belongs to someone who can hand it over. The cost of getting
 * it that way is that it arrives filthy.
 *
 * A real line looks like this:
 *
 *     12  AUGMENTIN TAB 625MG 6'S      GSK      2      1,242.00
 *     RISEK CAP 20MG 14S  255.00
 *     BROFEX SYP 120ML   145
 *
 * Four of those columns are none of our business. Price and pack size belong to
 * the store side and must never cross into the prescribing dictionary, so this
 * parser does not merely ignore them, it REMOVES them and reports what it
 * removed. What survives is brand, strength, form: the three things that print.
 *
 * NOTHING HERE IS TRUSTED. Every row this produces lands in a review list with
 * its problems marked, and a person promotes it. That is the same rule the
 * doctor's own typing follows. A parser confident enough to write straight into
 * the dictionary would be the bulk import that was refused all along, wearing a
 * different coat.
 */

export interface CleanRow {
  brand: string
  strength: string
  form: Form
  generic: string
  /** what was thrown away, shown to the person reviewing so a bad strip is visible */
  dropped: string[]
  /** why this row needs a human before it goes anywhere */
  issues: Issue[]
  /**
   * True for almost every row, and that is not a fault.
   *
   * A register names brands. It does not say what molecule AUGMENTIN is, and no
   * amount of parsing can invent that. So the formula is not an ANOMALY to be
   * flagged, it is the WORK: one pick from the closed WHO list per brand, done
   * once, and the Sindhi follows from it. Counting it as an error would mark
   * every row red and make the error column mean nothing.
   */
  needsFormula: boolean
  raw: string
}

export type Issue =
  | 'no-strength'      // a brand with no strength is half a prescription
  | 'odd-brand'        // one letter, or all digits: probably a header or a total
  | 'injection'        // real, but a clinic does not print it on a take-home slip
  | 'duplicate'        // same brand and strength already in this paste
  | 'junk'             // a total, a column header, a page number

export const ISSUE_TEXT: Record<Issue, string> = {
  'no-strength': 'no strength',
  'odd-brand': 'does not look like a medicine',
  injection: 'injection or drip',
  duplicate: 'already above',
  junk: 'not a medicine line',
}

/* ------------------------------------------------------------- vocabulary */

/** Form words as they are actually abbreviated on a Pakistani register. */
const FORMS: [RegExp, Form][] = [
  [/\b(syp|syr|syrup|susp|suspension|sus|elixir|drops?|drp|sol|solution|liquid|liq)\b/i, 'syr'],
  [/\b(cap|caps|capsule|capsules|softgel)\b/i, 'cap'],
  [/\b(tab|tabs|tablet|tablets|tabl|f\/c\s*tab|dt)\b/i, 'tab'],
  [/\b(inj|injection|amp|ampoule|vial|infusion|iv|im)\b/i, 'other'],
  [/\b(cream|oint|ointment|gel|lotion|spray|inhaler|puff|sachet|supp|suppository|patch|pessary)\b/i, 'other'],
]

const INJECTION = /\b(inj|injection|amp|ampoule|vial|infusion)\b/i

/**
 * Companies whose names sit in the middle of a register line. This list is
 * short on purpose: a wrong entry here deletes a real brand. When in doubt the
 * word survives into the brand and a person deletes it, which is recoverable.
 * A brand silently eaten by an over-eager list is not.
 */
const COMPANIES = new RegExp(
  '\\b(gsk|glaxo|getz|abbott|searle|hilton|martin\\s*dow|pfizer|sanofi|novartis|bosch|' +
  'highnoon|ferozsons|atco|barrett|hodgson|wilshire|scotmann|sami|tabros|nabiqasim|' +
  'platinum|genix|hiranis|indus|macter|helix|pharmatec|pharmevo|shaigan|zafa|efroze|' +
  'aspin|amson|brookes|ccl|geofman|horizon|leads|mass|medisure|novamed|otsuka|reckitt|' +
  'roche|schazoo|standpharm|unicure|werrick|epla|pacific|akhai|obs)\\b', 'gi')

/** Money. Rupee marks, thousands separators, trailing decimals, "T.P." and "R.P." */
const PRICE = /\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\b\d+\.\d{1,2}\b|\b(?:rs|pkr)\b\.?\s*\d+/gi

/** The word beside the money. "T.P 96.00" leaves a stranded "T.P" if the number
 *  alone is taken, and a stranded label reads as part of the brand name. */
const PRICE_LABEL = /\b(?:rs|pkr|price|mrp|m\.?r\.?p|t\.?\s?p|r\.?\s?p|rate|amt|amount|value|disc(?:ount)?)\b\.?/gi

/** Lines that are bookkeeping rather than medicine. */
const JUNK = /^(?:sub\s*)?(?:grand\s*)?total\b|^\s*(?:page|invoice|inv|bill|date|s\.?\s?no|sr\.?\s?#?|description|particulars|item|qty|quantity|rate|amount|carried|brought)\b/i

/**
 * Pack size, which is the trap in this whole file.
 *
 * "6'S", "14S", "10X10", "1x20", "PKG", "BOX OF 30", "120ML" are packaging.
 * "120MG/5ML" is a strength. Both contain ML, so the order below matters: the
 * strength pattern is pulled out FIRST and the remaining text is what pack size
 * is allowed to chew on.
 */
const PACK = /\b(?:\d+\s*[x×]\s*\d+|\d+\s*'?s\b|pkg|pack|packs|packet|box(?:es)?|strip|strips|btl|bottle|tin|jar|tube|nos|pcs|pc|unit|units|of\s+\d+)\b|\b\d+\s*ml\b/gi

/**
 * Strength. A number, then a real unit, optionally per a volume, optionally a
 * second half for a combination ("500mg + 125mg", "250/62.5mg").
 */
const STRENGTH = new RegExp(
  '\\b\\d+(?:\\.\\d+)?\\s*(?:mg|mcg|µg|ug|gm|iu|units?|g|%)' +
  '(?:\\s*/\\s*\\d*(?:\\.\\d+)?\\s*(?:ml|mg|g))?' +
  '(?:\\s*(?:\\+|/)\\s*\\d+(?:\\.\\d+)?\\s*(?:mg|mcg|g|iu|%)?)?', 'i')

/** Leading serial number: "12 ", "12. ", "12) ". Never part of a name. */
const SERIAL = /^\s*\d{1,4}\s*[.)\-]?\s+/

const tidy = (s: string) => s.replace(/\s+/g, ' ').replace(/^[\s,.;:|/\-]+|[\s,.;:|/\-]+$/g, '').trim()

/* ---------------------------------------------------------------- parsing */

/** One register line to one candidate row. Never throws: a line it cannot read
 *  comes back marked, because a silently skipped line is a medicine nobody
 *  notices is missing. */
export function cleanLine(raw: string): CleanRow | null {
  const line = raw.trim()
  if (!line) return null

  const dropped: string[] = []
  let s = line.replace(SERIAL, m => { dropped.push(tidy(m)); return ' ' })

  if (JUNK.test(tidy(s))) {
    return { brand: tidy(line).toUpperCase(), strength: '', form: 'other', generic: '',
             dropped: [], issues: ['junk'], needsFormula: false, raw: line }
  }

  // A generic the shop wrote after a dash is a gift. Take it before anything
  // else touches the line, so the cleaner does not shred it.
  let generic = ''
  const dash = s.split(/\s+[-—–|]\s+|\t\s*/)
  if (dash.length > 1) {
    const tail = tidy(dash.slice(1).join(' '))
    if (whoGeneric(tail)) { generic = whoGeneric(tail)!.name; s = dash[0] }
  }

  for (const m of s.match(PRICE) ?? []) dropped.push(tidy(m))
  s = s.replace(PRICE, ' ').replace(PRICE_LABEL, ' ')

  const st = s.match(STRENGTH)
  const strength = st ? tidy(st[0]).replace(/\s+/g, '').toLowerCase().replace(/(\d)([a-z%])/g, '$1 $2') : ''
  if (st) s = s.replace(STRENGTH, ' ')

  for (const m of s.match(PACK) ?? []) dropped.push(tidy(m))
  s = s.replace(PACK, ' ')

  const injection = INJECTION.test(s)
  let form: Form = 'tab'
  for (const [re, f] of FORMS) {
    if (re.test(s)) { form = f; const m = s.match(re); if (m) dropped.push(tidy(m[0])); s = s.replace(re, ' '); break }
  }
  // a second form word ("F/C TAB" after "CAP") is noise, not a second medicine
  for (const [re] of FORMS) s = s.replace(re, ' ')

  for (const m of s.match(COMPANIES) ?? []) dropped.push(tidy(m))
  s = s.replace(COMPANIES, ' ')

  // whatever is left over that is only digits is a quantity column
  s = s.replace(/\b\d+\b/g, m => { dropped.push(m); return ' ' })

  const brand = tidy(s).toUpperCase()
  if (!brand) return null

  // the shop's own word for the medicine is often the formula itself
  if (!generic) {
    const g = whoGeneric(brand)
    if (g) generic = g.name
  }

  const issues: Issue[] = []
  if (!strength && form !== 'syr') issues.push('no-strength')
  if (brand.length < 3 || /^[^A-Z]*$/.test(brand)) issues.push('odd-brand')
  if (injection) issues.push('injection')

  return { brand, strength, form, generic, needsFormula: !generic,
           dropped: dropped.filter(Boolean), issues, raw: line }
}

/** A whole pasted page. Marks repeats rather than dropping them, because a
 *  repeat in a register usually means two pack sizes, and which one survives
 *  is a decision for a person. */
export function cleanList(text: string): CleanRow[] {
  const out: CleanRow[] = []
  const seen = new Set<string>()
  for (const raw of text.split('\n')) {
    const row = cleanLine(raw)
    if (!row) continue
    const key = `${row.brand} ${row.strength}`.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (seen.has(key)) row.issues.push('duplicate')
    seen.add(key)
    out.push(row)
  }
  return out
}

/** Parsed without a problem. Still not prescribable: it needs a formula, and
 *  after the formula it needs a Sindhi word a person has read. */
export const isClean = (r: CleanRow) => r.issues.length === 0

export function tally(rows: CleanRow[]) {
  const t: Record<Issue, number> = {
    'no-strength': 0, 'odd-brand': 0, injection: 0, duplicate: 0, junk: 0,
  }
  for (const r of rows) for (const i of r.issues) t[i]++
  return {
    total: rows.length,
    clean: rows.filter(isClean).length,
    needFormula: rows.filter(r => r.needsFormula && isClean(r)).length,
    ...t,
  }
}
