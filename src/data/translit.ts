// English brand name -> Sindhi script, first pass.
//
// This is TRANSLITERATION, not translation: "Augmentin" must come out
// اوگمينٽن — how a Sindhi speaker says it — never a dictionary meaning.
//
// It will be wrong sometimes. English brand names in Pakistan are said the way
// people say them, not the way rules predict ("Panadol" is پيناڊول, not پاناڊول),
// so this produces a SUGGESTION for review, never a printed fact. renderSlip
// prints the Sindhi line only when a human has approved it.
//
// Note the loanword convention Sindhi uses for English words:
//   t -> ٽ (retroflex, not ت)   d -> ڊ (retroflex, not د)   k/c -> ڪ

const DIGRAPHS: [RegExp, string][] = [
  [/^au/, 'او'], [/^eu/, 'يو'], [/^ou/, 'او'],
  [/^ci/, 'س'], [/^ce/, 'س'], [/^cy/, 'س'],
  [/ium$/, 'يم'], [/in$/, 'ن'], [/tion$/, 'شن'],
  [/ph/g, 'ف'], [/ch/g, 'چ'], [/sh/g, 'ش'], [/th/g, 'ٿ'],
  [/kh/g, 'خ'], [/gh/g, 'غ'], [/ck/g, 'ڪ'], [/qu/g, 'ڪو'],
  [/oo/g, 'و'], [/ee/g, 'ي'], [/ea/g, 'ي'], [/ai/g, 'ائي'],
  [/ay/g, 'ي'], [/oa/g, 'و'], [/ie/g, 'ي'],
]

const LETTERS: Record<string, string> = {
  a: 'ا', b: 'ب', c: 'ڪ', d: 'ڊ', e: 'ي', f: 'ف', g: 'گ', h: 'ه',
  i: 'ي', j: 'ج', k: 'ڪ', l: 'ل', m: 'م', n: 'ن', o: 'و', p: 'پ',
  q: 'ق', r: 'ر', s: 'س', t: 'ٽ', u: 'و', v: 'و', w: 'و',
  x: 'ڪس', y: 'ي', z: 'ز',
}

const VOWEL = 'aeiou'

/** Best-effort Sindhi rendering of a Latin word. Always review before printing. */
export function toSindhi(input: string): string {
  const words = input.trim().toLowerCase().split(/\s+/)
  return words.map(w => {
    // strip anything that is not a latin letter — strengths and numbers stay Latin
    const raw = w.replace(/[^a-z]/g, '')
    if (!raw) return ''
    let s = raw
    for (const [re, out] of DIGRAPHS) s = s.replace(re, out)

    let out = ''
    for (let i = 0; i < s.length; i++) {
      const c = s[i]
      if (!/[a-z]/.test(c)) { out += c; continue }          // already converted
      const prev = s[i - 1]
      // a short medial 'a' between two consonants is usually not written
      if (c === 'a' && i > 0 && i < s.length - 1 &&
          prev && !VOWEL.includes(prev) && !VOWEL.includes(s[i + 1] ?? '')) continue
      out += LETTERS[c] ?? c
    }
    return out
  }).filter(Boolean).join(' ')
}

/** Split "AUGMENTIN 625 mg" into the name we transliterate and the part we leave alone. */
export function splitBrand(full: string): { name: string; rest: string } {
  const m = full.match(/^([A-Za-z][A-Za-z\s-]*?)\s*(\d.*)?$/)
  return { name: (m?.[1] ?? full).trim(), rest: (m?.[2] ?? '').trim() }
}
