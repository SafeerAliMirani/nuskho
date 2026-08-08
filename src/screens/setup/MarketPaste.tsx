import { useMemo, useState } from 'react'
import { cleanList, tally, isClean, ISSUE_TEXT, type CleanRow } from '../../data/clean'
import { PK_GENERICS, searchPkGenerics, pkClassOf } from '../../data/pk'
import { toSindhi } from '../../data/translit'
import { db, uid, doctorDrugs, similarDrugs } from '../../db'
import type { Drug } from '../../types'
import { doseSdFor, defaultRoute, FORM_LABEL } from '../../data/forms'

/**
 * The shop's list, cleaned.
 *
 * This screen exists because the answer to "where does the catalogue come from"
 * turned out to be the medical store, not a website. A pharmacy will hand over a
 * stock register or a distributor's price list to a doctor it already supplies.
 * That page is the real Larkana market: current, local, and owned by somebody
 * who can say yes.
 *
 * It also arrives as a wall of prices, pack sizes and company names. The work
 * this screen removes is the retyping. The work it deliberately does NOT remove
 * is the checking: every row lands here to be looked at, given a formula, and
 * promoted by a person. Admin only, never the doctor, and never during clinic.
 *
 * PRICE AND PACK SIZE ARE DESTROYED, NOT STORED. They are shown once, greyed,
 * so whoever is reviewing can see the parser cut in the right place, and then
 * they are gone. The rule that the prescribing side holds no commercial data
 * has to be enforced at the point the data arrives or it is not a rule.
 */

const SAMPLE = `12  AUGMENTIN TAB 625MG 6'S   GSK   1,242.00
RISEK CAP 20MG 14'S  255.00
BROFEX SYP 120ML  145.00
PANADOL TABS 500MG 10X10  Rs 320
TOTAL                        1,962.00`

type Row = CleanRow & { keep: boolean; sd: string }

/** One molecule, one key, so a shop's spelling and ours settle into one word. */
const gkey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/** The shelf's own spelling of a formula, for the formulas the shelf has. */
const SHELF_SPELLING = new Map(PK_GENERICS.map(g => [gkey(g), g]))

export default function MarketPaste() {
  const [text, setText] = useState('')
  const [rows, setRows] = useState<Row[] | null>(null)
  const [gFix, setGFix] = useState<number | null>(null)
  const [mine, setMine] = useState<Drug[]>([])
  const [out, setOut] = useState('')
  const [saved, setSaved] = useState(0)

  const t = useMemo(() => (rows ? tally(rows) : null), [rows])

  async function read() {
    const parsed = cleanList(text)
    setMine(await doctorDrugs([]))
    setRows(parsed.map(r => ({
      ...r,
      // junk and injections start unticked. Everything else starts ticked,
      // because the common case is a good page and unticking three rows is
      // faster than ticking ninety.
      keep: isClean(r),
      sd: '',
    })))
    setSaved(0)
    setOut('')
  }

  const set = (i: number, p: Partial<Row>) =>
    setRows(rs => rs && rs.map((r, k) => (k === i ? { ...r, ...p } : r)))

  /** Picking the formula fills the Sindhi guess too, since the two are one
   *  decision: what molecule is this, and what do we call it in Sindhi. */
  function pickGeneric(i: number, name: string) {
    setRows(rs => rs && rs.map((r, k) => k === i
      ? { ...r, generic: SHELF_SPELLING.get(gkey(name)) ?? name, sd: r.sd || toSindhi(r.brand) }
      : r))
    setGFix(null)
  }

  /**
   * Onto the doctor's own list, unverified.
   *
   * Not into dictionary.ts. That file only takes entries a person at Nuskho has
   * checked by hand, and a shop register has not been checked by anybody. These
   * land as ordinary pending medicines: usable tonight, sitting in the review
   * queue, and their Sindhi will not print until it is ticked.
   */
  async function addToList() {
    if (!rows) return
    const take = rows.filter(r => r.keep && r.brand)
    const have = new Set(mine.map(d => `${d.brand} ${d.strength}`.toLowerCase().replace(/[^a-z0-9]/g, '')))
    const fresh = take.filter(r =>
      !have.has(`${r.brand} ${r.strength}`.toLowerCase().replace(/[^a-z0-9]/g, '')))
    await db.drugs.bulkAdd(fresh.map(r => ({
      id: 'mkt_' + uid(),
      brand: r.brand, strength: r.strength, generic: r.generic,
      sd: r.sd || toSindhi(r.brand), sdReviewed: false,
      form: r.form === 'other' ? 'tab' : r.form,
      unitSd: doseSdFor(r.form), route: defaultRoute(r.form),
      verified: false, pending: true, addedAt: Date.now(),
    })))
    setSaved(fresh.length)
    setMine(await doctorDrugs([]))
  }

  /** The same paste-ready shape ReviewQueue writes, so a good shop page can be
   *  shipped to every future clinic instead of being cleaned again. */
  function writeLines() {
    if (!rows) return
    const lines = rows.filter(r => r.keep && r.generic && r.sd.trim())
      .map(r => `  { brand: '${r.brand.replace(/'/g, "\\'")}', strength: '${r.strength}', form: '${r.form}',`
              + ` generic: '${r.generic.replace(/'/g, "\\'")}', sd: '${r.sd.trim()}', verified: 'market ${new Date().toISOString().slice(0, 7)}' },`)
    setOut(lines.length
      ? lines.join('\n')
      : 'A row needs a formula AND a Sindhi word before it can be shipped to other clinics.')
  }

  return (
    <>
      <p className="hint">
        Paste a page from the pharmacy's stock register, a distributor price list, or a
        purchase invoice. <b>Prices and pack sizes are thrown away here</b>, not stored:
        they belong to the shop's own inventory, never to a prescription.
      </p>

      <textarea className="bulk" rows={9} value={text} onChange={e => setText(e.target.value)}
                placeholder={SAMPLE} />
      <div className="bulkbar">
        <button className="btn" disabled={!text.trim()} onClick={read}>Clean this list</button>
        {!text.trim() && <button className="lnk" onClick={() => setText(SAMPLE)}>show me with an example</button>}
      </div>

      {t && (
        <>
          <div className="sumbox">
            <div><span>Lines read</span><b>{t.total}</b></div>
            <div><span>Look like medicines</span><b>{t.clean}</b></div>
            <div><span>Need a formula</span><b>{t.needFormula}</b></div>
            <div><span>Set aside</span><b>{t.total - t.clean}</b></div>
          </div>
          <p className="hint">
            Untick anything wrong, then give each row its formula off the shelf. A Sindhi
            brand word is optional and nothing here claims one: the Sindhi that reaches the
            paper is the form and the timing, and those are a closed set somebody has already
            read. Anything typed in the Sindhi box waits for the Review tab before it prints,
            the same as every other Sindhi word in the app.
          </p>
        </>
      )}

      {rows && (
        <div className="druglist tall">
          {rows.map((r, i) => {
            const near = similarDrugs(r.brand, r.strength, mine)
            return (
              <div className={'drow mkt' + (r.keep ? '' : ' off')} key={i}>
                <input type="checkbox" checked={r.keep} onChange={e => set(i, { keep: e.target.checked })} />
                <b>{r.brand} {r.strength}</b>
                <span className="frm">{FORM_LABEL[r.form].toLowerCase()}</span>

                {r.generic ? (
                  <span className="gen">{r.generic}</span>
                ) : gFix === i ? (
                  <Pick start={r.brand} onPick={n => pickGeneric(i, n)} onClose={() => setGFix(null)} />
                ) : (
                  <button className="lnk gen off" onClick={() => setGFix(i)}>which formula?</button>
                )}

                <input className="sdin" dir="rtl" placeholder="سنڌي" value={r.sd}
                       onChange={e => set(i, { sd: e.target.value })} />

                <span className="drops">
                  {r.issues.map(k => <i key={k} className="warnpill">{ISSUE_TEXT[k]}</i>)}
                  {near.length > 0 && <i className="warnpill">have {near[0].brand} {near[0].strength}</i>}
                  {r.dropped.length > 0 && <small title={'removed: ' + r.dropped.join('  ')}>
                    cut {r.dropped.length}</small>}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {rows && (
        <>
          <div className="bulkbar">
            <button className="btn" onClick={addToList}>
              Add {rows.filter(r => r.keep).length} to the clinic's list
            </button>
            {saved > 0 && <span className="ok">{saved} added, waiting in Review ✓</span>}
          </div>
          <p className="hint">
            They go onto his list as <b>pending</b>. He can prescribe them tonight, and each
            one shows in the Review tab until somebody checks it. The Sindhi does not print
            until it is ticked, however it got here.
          </p>

          <h3>Ship a good page to the other clinics</h3>
          <p className="hint">
            Rows that have a formula and a Sindhi word can go into
            <code> src/data/dictionary.ts</code>, so the next clinic finds them on day one.
            Only do this for a page somebody has actually read.
          </p>
          <button className="btn" onClick={writeLines}>Write the dictionary lines</button>
          {out && <textarea className="bulk" rows={7} readOnly value={out}
                            onFocus={e => e.currentTarget.select()} />}
        </>
      )}
    </>
  )
}

function Pick({ start, onPick, onClose }:
  { start: string; onPick: (n: string) => void; onClose: () => void }) {
  const [q, setQ] = useState('')
  const hits = searchPkGenerics(q)
  return (
    <span className="gpick">
      <input autoFocus value={q} placeholder={`formula for ${start}`}
             onChange={e => setQ(e.target.value)}
             onKeyDown={e => { if (e.key === 'Escape') onClose() }} />
      {hits.length > 0 && (
        <span className="gopts">
          {hits.map(g => (
            <button key={g} className="gopt" onClick={() => onPick(g)}>
              {g}
              {pkClassOf(g) && <small>{pkClassOf(g)}</small>}
            </button>
          ))}
        </span>
      )}
      {q.trim().length >= 2 && !hits.length && (
        <span className="gopts">
          <button className="gopt" onClick={() => onPick(q.trim())}>
            Keep “{q.trim()}” as typed
            <small>not on our shelf. Fine, a shop stocks things we have not listed.</small>
          </button>
        </span>
      )}
    </span>
  )
}
