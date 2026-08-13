// GENERATES src/data/pk2.ts FROM research/pk2-source.json.
//
// Run:  node scripts/pk2gen.mjs
//
// Why a generator and not a hand-kept file: pk.ts is 249 rows a person curated
// one at a time, and stays that way. The second shelf is 5,331 rows read off
// manufacturer catalogue pages by machine on 11 Aug 2026, and a file that size
// is only trustworthy if a script derives it from its source data every time,
// because a hand edit inside it can never be reviewed. To change pk2, change
// research/pk2-source.json (or research/pk2-sindhi.json) and re-run this.
//
// The Sindhi column: research/pk2-sindhi.json maps BRAND -> suggested Sindhi.
// Absent file or absent brand means sd stays "", which prints nothing anyway,
// because a suggestion only reaches paper after a person ticks it (see pk.ts
// and dictionary.ts for that rule; nothing here changes it).
//
// CHECK FLAGS. A few strengths are transcribed exactly as the source prints
// them and the printed number is not credible (an inhaled steroid in mg, a
// beta blocker at ten times its usual top dose). Those rows keep the printed
// number but carry check:true so the screen shows them as unverified until a
// person reads the real box. The list is here, not in the data, so the next
// regeneration cannot lose it silently.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const SRC = 'research/pk2-source.json'
const SD = 'research/pk2-sindhi.json'
const OUT = 'src/data/pk2.ts'

const rows = JSON.parse(readFileSync(SRC, 'utf8')).rows
const sindhi = existsSync(SD) ? JSON.parse(readFileSync(SD, 'utf8')) : {}

// Strengths kept as printed but not credible as printed. brand + strength
// identifies the exact pack; the maker guards against a same-name collision.
const CHECK = [
  ['CARVILOL', '62.5 mg'],            // carvedilol printed at 10x usual max
  ['COLDREX', ''],                    // pseudoephedrine printed as 1 mg
  ['BETATEC', ''],                    // inhaled steroid printed in mg
  ['FORACORT HFA', ''],               // inhaled steroid printed in mg
]
const needsCheck = (r) => CHECK.some(([b, s]) => r.brand === b && (s === '' || r.strength === s))

const FORMS = ['tab', 'cap', 'syr', 'drop', 'cream', 'sachet', 'inhaler', 'supp', 'patch', 'other']
const CLS = [
  'Antibiotic', 'Painkiller and fever', 'Stomach and acid', 'Blood pressure and heart',
  'Allergy', 'Vitamins and minerals', 'Skin', 'Cough and cold', 'Worms and parasites',
  'Diabetes', 'Nerves and sleep', 'Eye and ear', 'Asthma and chest', 'Womens health',
  'Rehydration and salts', 'Other',
]

// Interned tables: the same generic appears on many rows (every ciprofloxacin
// brand shares one string), so rows point into tables instead of repeating
// them. This is a size decision, measured: plain JSON rows are ~850 KB of
// source, this shape is ~a third of it, and gzip serves either fine but the
// clinic machine parses the smaller one faster on a cold start.
const makers = [...new Set(rows.map(r => r.maker))].sort()
const generics = [...new Set(rows.map(r => r.generic))].sort()
const srcs = [...new Set(rows.map(r => r.src))].sort()
const gi = new Map(generics.map((g, i) => [g, i]))
const mi = new Map(makers.map((m, i) => [m, i]))
const si = new Map(srcs.map((s, i) => [s, i]))

const BAD = /[|\n]/
for (const r of rows) {
  if (BAD.test(r.brand + r.strength + r.generic)) throw new Error('separator char in data: ' + r.brand)
  if (!FORMS.includes(r.form)) throw new Error('bad form: ' + r.brand + ' ' + r.form)
  if (!CLS.includes(r.cls)) throw new Error('bad cls: ' + r.brand + ' ' + r.cls)
}

const enc = rows.map(r => [
  r.brand,
  r.strength,
  FORMS.indexOf(r.form),
  gi.get(r.generic),
  CLS.indexOf(r.cls),
  mi.get(r.maker),
  si.get(r.src),
  needsCheck(r) ? 1 : 0,
  sindhi[r.brand] ?? '',
].join('|')).join('\n')

const withSd = rows.filter(r => (sindhi[r.brand] ?? '') !== '').length

const file = `import type { Form } from '../types'
import type { PkMed } from './pk'

// THE SECOND SHELF. GENERATED FILE, DO NOT EDIT BY HAND.
//
// ${rows.length} packs, ${new Set(rows.map(r => r.brand)).size} brands, ${makers.length} makers, harvested from
// druginfosys.com manufacturer catalogue pages on 11 Aug 2026 and machine
// audited (schema, vocabulary, duplicates, injectables, withdrawn molecules,
// collision with pk.ts). A 44-row random sample was re-verified against the
// source pages by independent agents: 0 invented rows. The harvest method,
// its known gaps and every judgement call live in research/pk2-source.json
// and the project log.
//
// THE SAME RULE AS pk.ts, RESTATED: a row claims only what the source page
// printed. ${rows.filter(r => !r.strength).length} rows carry an empty strength because the page printed none
// we trusted, and an empty strength beats a remembered one. Rows with
// check:true carry a printed-but-not-credible number and stay marked until a
// person reads the real box.
//
// Rows are pipe-packed and parsed once at load: brand|strength|form#|generic#|
// cls#|maker#|source#|check|sd. Tables below de-duplicate the repeated
// strings. To change anything, edit research/pk2-source.json and re-run
// scripts/pk2gen.mjs. Sindhi suggestions (${withSd} of ${rows.length} rows carry one) come
// from research/pk2-sindhi.json through the same generator, and stay
// suggestions: nothing prints until a person in the clinic ticks it.

const F: Form[] = ${JSON.stringify(FORMS)} as Form[]
const C = ${JSON.stringify(CLS)}
const M = ${JSON.stringify(makers)}
const S = ${JSON.stringify(srcs)}
const G = ${JSON.stringify(generics)}

const ROWS = \`${enc}\`

export const PK2_MEDS: PkMed[] = ROWS.split('\\n').map(line => {
  const [brand, strength, f, g, c, m, s, chk, sd] = line.split('|')
  const row: PkMed = {
    brand, strength, form: F[+f], generic: G[+g], cls: C[+c], maker: M[+m], sd,
  }
  if (chk === '1') row.check = true
  ;(row as PkMed & { src?: string }).src = S[+s]
  return row
})
`
writeFileSync(OUT, file)
console.log(`wrote ${OUT}: ${rows.length} rows, ${withSd} with Sindhi, ${(file.length / 1024).toFixed(0)} KB`)
