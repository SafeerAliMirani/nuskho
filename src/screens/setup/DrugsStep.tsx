import { useEffect, useState } from 'react'
import { db, uid, doctorDrugs, archiveDrug, unarchiveDrug, similarDrugs } from '../../db'
import { formulary } from '../../data/formulary'
import { toSindhi, splitBrand } from '../../data/translit'
import { searchDictionary, dictLine, type DictEntry } from '../../data/dictionary'
import { whoGeneric, searchGenerics, normGeneric, WHO_EDITION } from '../../data/who'
import { ArtNoDrugs, IcSearch } from '../../ui/art'
import { Note, Tip } from '../../ui/Note'
import { doseSdFor, defaultRoute } from '../../data/forms'
import type { Drug, Form } from '../../types'

/**
 * His own medicine list.
 *
 * This is the step that decides whether the app survives a real evening. A
 * doctor who has to search for every medicine is slower than his own pen, and
 * he will stop using it on the second night.
 *
 * Bulk paste, because the fastest way to get this right is to sit with him,
 * take twenty of his old handwritten prescriptions, and type what is actually
 * on them. He can still add anything mid-consultation later.
 */

// Drops used to be inside this pattern, so a doctor typing "TOBREX eye drops"
// got a syrup, and the slip printed him a spoon. Order matters below: a line
// can carry both "drops" and "solution".
const DROP_RE = /\b(drops?|drp|e\/d)\b/i
const CREAM_RE = /\b(cream|oint|ointment|gel|lotion)\b/i
const SACHET_RE = /\b(sachet|sachets|sach|powder|granules|ors)\b/i
const SYR = /\b(syr|syrup|susp|suspension|solution|elixir)\b/i
const CAP = /\b(cap|caps|capsule|capsules)\b/i

/** The dose word for a form, and only when a person has read it. An unread
 *  word is left blank and the slip prints the English one: see data/forms.ts. */
function unitFor(f: Form): string {
  return doseSdFor(f)
}

/** One medicine per line. "BRAND 500mg" or "BRAND 500mg - Generic" or with a comma. */
export function parseList(text: string): Drug[] {
  const out: Drug[] = []
  const seen = new Set<string>()
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const [lhsRaw, ...restParts] = line.split(/\s+[-—–|,]\s+|\t/)
    const typed = restParts.join(' ').trim()
    // If what he typed is a formula WHO names, store WHO's spelling of it. This
    // is the only place spelling is unified, and it is worth doing here: two
    // spellings of one molecule are two molecules to every later check.
    const generic = whoGeneric(typed)?.name ?? typed

    // "RISEK 20mg cap" -> RISEK / 20mg / capsule, not a brand called "20mg cap".
    // The form word is a fact about the medicine, never part of its printed name.
    const form: Form = DROP_RE.test(lhsRaw) ? 'drop'
      : CREAM_RE.test(lhsRaw) ? 'cream'
      : SACHET_RE.test(lhsRaw) ? 'sachet'
      : SYR.test(lhsRaw) ? 'syr'
      : CAP.test(lhsRaw) ? 'cap' : 'tab'
    const lhs = lhsRaw.replace(SYR, ' ').replace(CAP, ' ').replace(/\s+/g, ' ').trim()

    const { name, rest } = splitBrand(lhs)
    if (!name) continue
    const brand = name.toUpperCase()
    const strength = rest || (form === 'syr' ? 'syrup' : form === 'drop' ? 'drops' : '')
    const key = (brand + ' ' + strength).trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      id: 'own_' + uid(),
      brand, strength, generic,
      sd: toSindhi(name), sdReviewed: false,   // never printed until a person checks it
      form, route: defaultRoute(form), unitSd: unitFor(form), addedAt: Date.now(),
    })
  }
  return out
}

export default function DrugsStep() {
  const [text, setText] = useState('')
  const [mine, setMine] = useState<Drug[]>([])
  const [added, setAdded] = useState(0)
  const [find, setFind] = useState('')
  const [sdEdit, setSdEdit] = useState<Record<string, string>>({})
  const [gFix, setGFix] = useState<string | null>(null)

  const load = async () => setMine(await doctorDrugs([]))
  useEffect(() => { load() }, [])

  const preview = parseList(text)
  // duplicates against what he already has, shown before anything is added
  const clash = preview.filter(d => similarDrugs(d.brand, d.strength, mine).length > 0)

  async function add() {
    if (!preview.length) return
    const have = new Set(mine.map(d => `${d.brand} ${d.strength}`.trim().toLowerCase()))
    const fresh = preview.filter(d => !have.has(`${d.brand} ${d.strength}`.trim().toLowerCase()))
    await db.drugs.bulkAdd(fresh)
    setAdded(fresh.length)
    setText('')
    await load()
  }

  async function loadSamples() {
    const have = new Set(mine.map(d => d.id))
    await db.drugs.bulkAdd(formulary.filter(d => !have.has(d.id)))
    await load()
  }

  // Never deleted. A prescription already in someone's hand may name it, and
  // that record has to stay answerable for years.
  /** Straight from the dictionary onto his list, unconfirmed Sindhi and all. */
  async function take(e: DictEntry) {
    const key = `${e.brand} ${e.strength}`.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (mine.some(d => `${d.brand} ${d.strength}`.toLowerCase().replace(/[^a-z0-9]/g, '') === key)) {
      setFind(''); return
    }
    await db.drugs.add({
      id: 'own_' + uid(), brand: e.brand, strength: e.strength, generic: e.generic,
      sd: e.sd || toSindhi(e.brand), sdReviewed: false, form: e.form, addedAt: Date.now(),
      unitSd: doseSdFor(e.form), route: defaultRoute(e.form),
    })
    setFind('')
    await load()
  }

  /**
   * The doctor ticking his own Sindhi, at the moment he adds the medicine.
   *
   * This belongs here and not in the admin queue. He reads Sindhi, he knows how
   * his patients say the name, and he is already looking at the word. Two
   * seconds each. Until he ticks it the name is simply not printed, so nothing
   * unsafe can reach a slip while the list is still being built.
   */
  async function confirmSd(d: Drug) {
    const text = (sdEdit[d.id] ?? d.sd).trim()
    if (!text) return
    await db.drugs.update(d.id, { sd: text, sdReviewed: true })
    setSdEdit(v => { const n = { ...v }; delete n[d.id]; return n })
    await load()
  }

  async function retire(id: string) {
    await archiveDrug(id)
    await load()
  }

  /**
   * RETIRE WAS A ONE-WAY DOOR, AND IT SHOULD NEVER HAVE BEEN.
   *
   * `doctorDrugs()` filters archived medicines out of the picker — correctly,
   * that is the whole point of retiring one — and this list is built from it.
   * So a mis-tap on the button one line below took a medicine off every screen
   * in the app, with nothing anywhere showing what had gone.
   *
   * `unarchiveDrug` has existed as long as `archiveDrug` and had no caller. The
   * DOCTORS list, in this same Setup screen, has always offered retire and
   * bring back side by side. This list offered half of it.
   *
   * Nothing was ever lost: the row stays in the database and every slip already
   * printed carries its own frozen copy of the medicine, which is what
   * snapshots are for. What was lost was the doctor's ability to correct
   * himself, and it belongs HERE rather than in the review queue, because the
   * review queue is behind the Nuskho passphrase and the doctor who pressed
   * retire cannot open it.
   */
  const [gone, setGone] = useState<Drug[]>([])
  const loadGone = async () => setGone((await db.drugs.toArray()).filter(d => d.archived))
  useEffect(() => { loadGone() }, [mine])

  async function bringBack(id: string) {
    await unarchiveDrug(id)
    await load()
    await loadGone()
  }

  /** Attach a medicine to a formula from the WHO list. */
  async function setGeneric(id: string, name: string) {
    await db.drugs.update(id, { generic: name })
    setGFix(null)
    await load()
  }

  /**
   * Two brands, one molecule. Nothing here is wrong — a doctor legitimately
   * stocks PANADOL tablets and CALPOL syrup — but he should see it, because the
   * one mistake this catches is the same medicine reaching one patient twice
   * under two names, which no spelling check can find.
   */
  const formulaCount = new Map<string, number>()
  for (const d of mine) {
    const g = whoGeneric(d.generic)
    if (g) formulaCount.set(g.name, (formulaCount.get(g.name) ?? 0) + 1)
  }

  return (
    <>
      <div className="fld">
        <label><IcSearch size={13} /> Search for his medicines &nbsp; دوا ڳوليو</label>
        <input value={find} onChange={e => setFind(e.target.value)}
               placeholder="type two letters of a brand or a formula" />
      </div>
      {find.trim().length >= 2 && (
        <div className="dict">
          {searchDictionary(find).map(e => (
            <button className="drow2" key={e.brand + e.strength} onClick={() => take(e)}>
              <span className="dl">{dictLine(e)}</span>
              <span className="add">add</span>
            </button>
          ))}
          <button className="drow2 own" onClick={() => { setText(find); setFind('') }}>
            <span className="dl">Not here — type “{find.trim()}” in below</span>
            <span className="add">type it</span>
          </button>
        </div>
      )}

      <p className="hint">
        Paste or type his list. <b>One medicine per line</b>, the brand exactly as it is
        printed on the box. A generic name after a dash is optional.
      </p>
      <textarea className="bulk" rows={8} value={text} onChange={e => setText(e.target.value)}
                placeholder={'PANADOL 500mg - Paracetamol\nAUGMENTIN 625mg - Amoxicillin + Clavulanic acid\nBROFEX syrup - Guaifenesin\nRISEK 20mg cap - Omeprazole'} />
      {clash.length > 0 && (
        <p className="usable bad">
          {clash.length} of these look like medicines already on his list
          ({clash.slice(0, 3).map(d => `${d.brand} ${d.strength}`.trim()).join(', ')}
          {clash.length > 3 ? '…' : ''}). Exact repeats are skipped; near matches are not,
          so check the spelling before adding.
        </p>
      )}
      <div className="bulkbar">
        <button className="btn" disabled={!preview.length} onClick={add}>
          {preview.length ? `Add ${preview.length} medicine${preview.length > 1 ? 's' : ''}` : 'Add'}
        </button>
        {added > 0 && <span className="ok">{added} added ✓</span>}
        {!mine.length && <button className="lnk" onClick={loadSamples}>or start from our sample list</button>}
      </div>

      <Note tone="safe" title="No unchecked Sindhi is ever printed">
        The Sindhi beside each medicine is a <b>guess from the spelling</b>, and it stays off
        every slip until the doctor ticks it. Ask him to read each one aloud: he knows how his
        patients say the name, and it is two seconds each.
      </Note>

      <h3>His list — {mine.length}</h3>
      {mine.length === 0 ? (
        <div className="blank">
          <ArtNoDrugs />
          <b>The shelf is empty</b>
          <p>Search above, or paste his list into the box. Twenty of his own old
             prescriptions is the fastest way to fill this.</p>
        </div>
      ) : mine.length < 20 && (
        <Note tone="warn" title={`Only ${mine.length} medicines on his list`}>
          He will be searching mid-consultation, which is slower than his pen and is how
          an app gets abandoned on the second night. Aim for 30 to 50 before a real evening.
        </Note>
      )}
      <div className="druglist">
        {mine.map(d => {
          const g = whoGeneric(d.generic)
          const shared = g ? (formulaCount.get(g.name) ?? 0) : 0
          return (
          <div className="drow" key={d.id}>
            <b>{d.brand} {d.strength}</b>
            {g ? (
              <span className="gen" title={`WHO Model List of Essential Medicines, ${WHO_EDITION}. ${g.oral || 'not an oral medicine'}`}>
                {g.name}
                {g.aware && <b className={'aware ' + g.aware.toLowerCase()}>{g.aware}</b>}
                {shared > 1 && <i className="warnpill">same formula as {shared - 1} other</i>}
              </span>
            ) : gFix === d.id ? (
              <GenericPick start={d.generic} onPick={n => setGeneric(d.id, n)} onClose={() => setGFix(null)} />
            ) : (
              <button className="lnk gen off" onClick={() => setGFix(d.id)}>
                {d.generic ? `${d.generic} — not on the WHO list, check it` : 'which formula?'}
              </button>
            )}
            {d.sdReviewed
              ? <span className="sd ok" title="Confirmed. This prints on the slip.">{d.sd} ✓</span>
              : (
                <span className="sdfix">
                  <input className="sdin" dir="rtl" value={sdEdit[d.id] ?? d.sd}
                         onChange={e => setSdEdit(v => ({ ...v, [d.id]: e.target.value }))} />
                  <button className="lnk" onClick={() => confirmSd(d)}>correct ✓</button>
                </span>
              )}
            <button className="lnk" onClick={() => retire(d.id)}>retire</button>
          </div>
          )
        })}
      </div>

      {/* Hidden on every evening nothing is retired, because a permanent empty
          heading in a settings screen is a thing people learn to scroll past,
          and this one needs reading on the evening it has something in it. */}
      {gone.length > 0 && (
        <div className="lhbox" style={{ marginTop: 18 }}>
          <h3>Retired — {gone.length}</h3>
          <p>
            Off the picker and off every screen, and still on this machine. Prescriptions
            already printed are untouched: each one carries its own copy of the medicine
            exactly as it was that evening.
          </p>
          {gone.map(d => (
            <div className="drow2" key={d.id}>
              <div>
                <b>{d.brand} {d.strength}</b>
                <span>{d.generic || 'no formula'}{d.sd ? ` \u00b7 ${d.sd}` : ''}</span>
              </div>
              <button className="btn ghost" onClick={() => bringBack(d.id)}>Bring it back</button>
            </div>
          ))}
        </div>
      )}

      <Tip tone="info">
        <b>Access</b>, <b>Watch</b> and <b>Reserve</b> are WHO's own antibiotic groups, from the
        Model List of Essential Medicines ({WHO_EDITION}). Watch and Reserve are the two to
        think twice about. The list names no brands, so nothing is ever prescribed from it.
      </Tip>
    </>
  )
}

/**
 * Picking the formula off a closed list rather than typing it.
 *
 * Free text here was quietly costing us everything downstream: "Amoxicillin+Clav",
 * "Co-amoxiclav" and "amoxycillin + clavulanic acid" are three molecules to a
 * computer and one to a chemist. A closed list ends that permanently, and it is
 * closed by WHO rather than by us.
 */
function GenericPick({ start, onPick, onClose }:
  { start: string; onPick: (name: string) => void; onClose: () => void }) {
  const [q, setQ] = useState(start)
  const hits = searchGenerics(q)
  return (
    <span className="gpick">
      <input autoFocus value={q} placeholder="formula — type three letters"
             onChange={e => setQ(e.target.value)}
             onKeyDown={e => { if (e.key === 'Escape') onClose() }} />
      {hits.length > 0 && (
        <span className="gopts">
          {hits.map(g => (
            <button key={g.name} className="gopt" onClick={() => onPick(g.name)}>
              {g.name}
              {g.aware && <b className={'aware ' + g.aware.toLowerCase()}>{g.aware}</b>}
              <small>{g.cls}{g.oral ? ' · ' + g.oral : ''}</small>
            </button>
          ))}
        </span>
      )}
      {q.trim().length >= 2 && !hits.length && (
        <span className="gopts">
          <button className="gopt" onClick={() => onPick(q.trim())}>
            Keep “{q.trim()}” as typed
            <small>not on the WHO list. It still works, it just gets no formula checks.</small>
          </button>
        </span>
      )}
      <button className="lnk" onClick={onClose}>cancel</button>
    </span>
  )
}

/** Exported so ReviewQueue can offer the same closed list. */
export { GenericPick }
export const isWhoFormula = (s: string) => !!normGeneric(s) && !!whoGeneric(s)
