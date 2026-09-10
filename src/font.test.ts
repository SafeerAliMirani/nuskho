import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

// read from disk rather than through vite's ?raw: this test runs in node, and
// the point is what ships in the file
const fontsCss = readFileSync(new URL('./print/fonts.css', import.meta.url), 'utf8')

/**
 * THE SINDHI FACE, PINNED.
 *
 * Every Sindhi character this app prints is drawn by the 'NK' family, and
 * 'NK' is Noto Naskh Arabic embedded as base64 in fonts.css. Two things could
 * go wrong quietly: somebody replaces the face with one that has no ڪ in it,
 * or somebody switches it to a link and the clinic with no internet prints a
 * row of boxes. Neither would fail any other test in this suite, and both
 * would be discovered on paper, by a patient.
 *
 * The coverage itself (every Sindhi letter, every hay form, the joining
 * features init/medi/fina/rlig/ccmp/locl) was verified against the font
 * tables when it was chosen; what a unit test can hold is that the face is
 * still here, still embedded, and still carries its licence.
 */
describe('the Sindhi face', () => {
  it('is embedded, not fetched: a clinic with the router unplugged still prints Sindhi', () => {
    expect(fontsCss).toContain('data:font/woff2;base64,')
    expect(fontsCss).not.toMatch(/src:\s*url\(['"]?https?:/)
    expect(fontsCss).not.toContain('fonts.googleapis.com')
  })
  it('is the regular and the bold of one family, and nothing else', () => {
    const faces = fontsCss.match(/@font-face\{/g) ?? []
    expect(faces.length).toBe(2)
    expect(fontsCss.match(/@font-face\{font-family:'NK'/g)?.length).toBe(2)
    expect(fontsCss).toContain('font-weight:400')
    expect(fontsCss).toContain('font-weight:700')
  })
  it('waits for itself rather than flashing a fallback that has no ڪ in it', () => {
    expect(fontsCss.match(/font-display:block/g)?.length).toBe(2)
  })
  it('carries enough bytes to be a real Arabic-script face', () => {
    // a subset with the Sindhi letters, the hay forms and the joining tables
    // is ~50KB per weight; anything much smaller has had something cut out
    for (const b64 of fontsCss.match(/base64,([A-Za-z0-9+/=]+)/g) ?? []) {
      expect(b64.length * 3 / 4).toBeGreaterThan(40_000)
    }
  })
  it('says what it is, so the next person does not have to guess what NK means', () => {
    expect(fontsCss).toContain('Noto Naskh Arabic')
    expect(fontsCss).toContain('Open Font License')
  })
})
