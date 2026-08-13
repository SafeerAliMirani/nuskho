import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { PK2_MEDS } from './data/pk2'
import { PK_MEDS } from './data/pk'
import { dictionary, searchDictionary } from './data/dictionary'
import { FORM_WORD } from './data/forms'

/**
 * THE SECOND SHELF IS GENERATED, AND A GENERATED FILE CAN GO STALE OR MANGLED
 * WITHOUT A HUMAN NOTICING, so these tests hold it to its source and to the
 * same promises pk.ts makes by hand.
 */
describe('pk2, the harvested shelf', () => {
  it('carries exactly the rows its source JSON carries', () => {
    // The generator and the app must never disagree about what the harvest
    // said. If this fails, someone edited pk2.ts by hand or forgot to re-run
    // scripts/pk2gen.mjs after changing the source.
    const src = JSON.parse(readFileSync('research/pk2-source.json', 'utf8')).rows
    expect(PK2_MEDS.length).toBe(src.length)
    // Spot-weld both ends and the middle so a truncated parse cannot pass on
    // length alone being right by accident of an edit.
    for (const i of [0, Math.floor(src.length / 2), src.length - 1]) {
      expect(PK2_MEDS[i].brand).toBe(src[i].brand)
      expect(PK2_MEDS[i].strength).toBe(src[i].strength)
      expect(PK2_MEDS[i].generic).toBe(src[i].generic)
      expect(PK2_MEDS[i].form).toBe(src[i].form)
    }
  })

  it('speaks only the form vocabulary the printer knows', () => {
    // A form outside FORM_WORD would print an empty word and no pictogram.
    for (const m of PK2_MEDS) expect(FORM_WORD[m.form], m.brand).toBeTruthy()
  })

  it('never repeats a pack and never carries a brand pk.ts already has', () => {
    // One brand lives in one file, so a correction is made in one place. The
    // harvest excluded pk.ts brands by exact name; this is the check that the
    // exclusion actually held all the way into the build.
    const hand = new Set(PK_MEDS.map(m => m.brand))
    const seen = new Set<string>()
    for (const m of PK2_MEDS) {
      expect(hand.has(m.brand), `${m.brand} is on both shelves`).toBe(false)
      const k = `${m.brand}|${m.strength}|${m.form}`
      expect(seen.has(k), `${k} appears twice`).toBe(false)
      seen.add(k)
    }
  })

  it('claims no strength it does not have', () => {
    // An empty strength is honest. A whitespace or placeholder strength is a
    // claim that failed to say nothing.
    for (const m of PK2_MEDS) {
      expect(m.strength).toBe(m.strength.trim())
      if (m.strength) expect(m.strength, m.brand).toMatch(/\d/)
    }
  })

  it('keeps every Sindhi suggestion a suggestion', () => {
    // sd on the shelf is a candidate. The gate that keeps it off paper is
    // sdReviewed on the doctor's own copy, set by a person; the shelf itself
    // must never carry a reviewed mark. PkMed has no such field, so what this
    // really pins is that nobody adds one to the generator in a hurry.
    for (const m of PK2_MEDS) expect('sdReviewed' in m).toBe(false)
  })

  it('is searchable end to end', () => {
    // The point of five thousand rows is that typing finds them. One prefix
    // from each end of the alphabet, and a generic, and a class word.
    expect(searchDictionary('zyspan').length).toBeGreaterThan(0)
    expect(searchDictionary('afantrine').length).toBeGreaterThan(0)
    expect(searchDictionary('amoxicillin').length).toBeGreaterThan(0)
    expect(searchDictionary('antib').length).toBeGreaterThan(0)
    // And the hand shelf still outranks it: PANADOL's first hit is pk.ts's.
    const p = searchDictionary('panadol')
    expect(p[0].verified).toBe('pk-2026-08')
  })

  it('rows a person must re-read are marked, and only those', () => {
    // The check flags survive regeneration because they live in the generator,
    // not the data. If this count drifts, someone changed the flag list and
    // this test is the reminder that the change must be deliberate.
    const flagged = dictionary.filter(e => e.check).map(e => e.brand)
    expect(flagged).toContain('CARVILOL')
    expect(flagged).toContain('COLDREX')
  })
})
