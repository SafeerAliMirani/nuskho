// Pictograms, ported unchanged from the sheets already tested on paper.
// Rules that must not be broken: solid fills over thin outlines, minimum
// 0.3 mm stroke, at most three elements, nothing below 4 mm on the page,
// and never a negation slash — an illiterate reader does not read a slash.

const svg = (w: string, h: string, body: string, vb = '0 0 24 24') =>
  `<svg width="${w}" height="${h}" viewBox="${vb}" fill="none" stroke="currentColor" ` +
  `stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ` +
  `style="vertical-align:middle">${body}</svg>`

export const SUNRISE = (w: string, h: string) => svg(w, h,
  '<path d="M3.6 17.4a8.4 8.4 0 0 1 16.8 0z" fill="currentColor" stroke="none"/>' +
  '<path d="M1.8 17.4h20.4" stroke-width="2.4"/>' +
  '<path d="M12 2.2v3.2M4.4 6.2l2.2 2.2M19.6 6.2l-2.2 2.2" stroke-width="2"/>')

export const SUN = (w: string, h: string) => svg(w, h,
  '<circle cx="12" cy="12" r="5.2" fill="currentColor" stroke="none"/>' +
  '<path d="M12 1.4v3M12 19.6v3M1.4 12h3M19.6 12h3M4.4 4.4l2.1 2.1M17.5 17.5l2.1 2.1' +
  'M19.6 4.4l-2.1 2.1M6.5 17.5l-2.1 2.1" stroke-width="2"/>')

export const MOON = (w: string, h: string) => svg(w, h,
  '<path d="M20.4 15.2A9 9 0 0 1 8.8 3.6 9 9 0 1 0 20.4 15.2z" fill="currentColor" stroke="none"/>')

export const TAB = (w: string, h: string) => svg(w, h,
  '<circle cx="12" cy="12" r="8.4" stroke-width="2"/>' +
  '<line x1="5.2" y1="12" x2="18.8" y2="12" stroke-width="2"/>')

export const HALF = (w: string, h: string) => svg(w, h,
  '<path d="M12 3.4a8.6 8.6 0 0 0 0 17.2z" fill="currentColor" stroke="none"/>' +
  '<path d="M12 3.4v17.2" stroke-width="1.4"/>')

export const CAP = (w: string, h: string) => svg(w, h,
  '<rect x="2.6" y="8" width="18.8" height="8" rx="4" stroke-width="2"/>' +
  '<path d="M6.6 8h5.4v8H6.6a4 4 0 0 1 0-8z" fill="currentColor" stroke="none"/>')

export const SPOON = (w: string, h: string) => svg(w, h,
  '<path d="M2.2 13.2a5 3.4 0 0 0 10 0z" fill="currentColor" stroke="none"/>' +
  '<ellipse cx="7.2" cy="13.2" rx="5" ry="3.4" stroke-width="1.8"/>' +
  '<path d="M11.6 11.6L21.4 8" stroke-width="2.4"/>')

/** Fork + plate + spoon. The knife was removed — at arm's length it read as a line. */
export const PLATE = (w: string, h: string) => {
  const hh = parseFloat(h)
  return svg(`${hh * 1.25}mm`, h,
    '<circle cx="15" cy="12.4" r="6.4" stroke-width="2.1"/>' +
    '<path d="M2.6 3v4.6a1.9 1.9 0 0 0 3.8 0V3" stroke-width="1.9"/>' +
    '<path d="M4.5 9.2v11.6" stroke-width="1.9"/>' +
    '<ellipse cx="25.8" cy="5.6" rx="2.1" ry="3" stroke-width="1.9"/>' +
    '<path d="M25.8 9v11.8" stroke-width="1.9"/>', '0 0 30 24')
}

export const ARROW = (w: string, h: string) => svg(w, h,
  '<path d="M3 12h15" stroke-width="2"/><path d="M14 7l5 5-5 5" stroke-width="2"/>')

export const CAL = (w: string, h: string) => svg(w, h,
  '<rect x="3.2" y="5" width="17.6" height="16" rx="1.8" stroke-width="1.8"/>' +
  '<path d="M3.2 10h17.6" stroke-width="2"/>' +
  '<path d="M8 2.8V6M16 2.8V6" stroke-width="2"/>')

export const WATER = (w: string, h: string) => svg(w, h,
  '<path d="M6.4 4h11.2l-1.3 15.4a1.9 1.9 0 0 1-1.9 1.8H9.6a1.9 1.9 0 0 1-1.9-1.8z" stroke-width="1.9"/>' +
  '<path d="M7.1 12.4h9.8l-.7 7a1.9 1.9 0 0 1-1.9 1.8H9.6a1.9 1.9 0 0 1-1.9-1.8z" fill="currentColor" stroke="none"/>')

/** Keep out of reach — a positive scene, never a slash. */
export const SHELF = (w: string, h: string) => svg(w, h,
  '<path d="M2.4 8.6h19.2" stroke-width="2.2"/>' +
  '<path d="M15.6 3.2h3.4v5.2h-3.4z" fill="currentColor" stroke="none"/>' +
  '<circle cx="7.2" cy="14.4" r="2.2" stroke-width="1.7"/>' +
  '<path d="M7.2 16.8v4.6M4.6 21.4h5.2M7.2 18.4l3.4-3.2" stroke-width="1.7"/>')

/** Meal timing as one scene: pill→plate = before food, plate→pill = after food. */
export function foodIcon(kind: 'before' | 'after', mm: number): string {
  const plate = PLATE(`${mm}mm`, `${mm}mm`)
  const pill = TAB(`${mm * 0.85}mm`, `${mm * 0.85}mm`)
  const a = ARROW(`${mm * 0.66}mm`, `${mm * 0.66}mm`)
  const seq = kind === 'before' ? [pill, a, plate] : [plate, a, pill]
  return `<span style="white-space:nowrap;display:inline-flex;align-items:center;gap:.3mm">${seq.join('')}</span>`
}

export const adviceIcon: Record<string, (w: string, h: string) => string> = {
  water: WATER,
  reach: SHELF,
}
