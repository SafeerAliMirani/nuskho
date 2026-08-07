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

/* --------------------------------------------------- forms that are not pills
 *
 * Every one of these existed on prescriptions in Larkana long before Nuskho,
 * and Nuskho printed a tablet for all of them. An eye drop with a spoon beside
 * it is not a cosmetic fault: the patient who most needs these pictures is the
 * one who cannot read the line above them.
 *
 * Same rules as the sheet above: solid fills over thin outlines, at most three
 * elements, nothing that needs to be read at arm's length, and never a slash.
 */

/** A dropper bottle with one drop leaving it. */
export const DROPPER = (w: string, h: string) => svg(w, h,
  '<path d="M9 2.4h6v3.2H9z" fill="currentColor" stroke="none"/>' +
  '<path d="M7.4 5.6h9.2v9.6a4.6 4.6 0 0 1-9.2 0z" stroke-width="1.9"/>' +
  '<path d="M12 17.6c1.6 2 2.4 3 2.4 3.9a2.4 2.4 0 0 1-4.8 0c0-.9.8-1.9 2.4-3.9z" ' +
  'fill="currentColor" stroke="none"/>')

/** One drop, for the dose columns where a tablet would otherwise sit. */
export const DROP = (w: string, h: string) => svg(w, h,
  '<path d="M12 2.6c4.6 5.8 6.8 8.9 6.8 11.6a6.8 6.8 0 0 1-13.6 0c0-2.7 2.2-5.8 6.8-11.6z" ' +
  'fill="currentColor" stroke="none"/>')

/** An eye. Drawn open and plain: the site, not an expression. */
export const EYE = (w: string, h: string) => svg(w, h,
  '<path d="M1.6 12S5.6 5.4 12 5.4 22.4 12 22.4 12 18.4 18.6 12 18.6 1.6 12 1.6 12z" stroke-width="1.9"/>' +
  '<circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none"/>')

/**
 * An ear. The first attempt read as a question mark at 6 mm, which on a
 * prescription is worse than no picture: a reader who cannot read the line
 * will believe the picture. This one is the outer rim as a full closed curve
 * with the inner fold inside it, which is what an ear looks like from a metre
 * away.
 */
export const EAR = (w: string, h: string) => svg(w, h,
  '<path d="M15.6 3.4c-4 0-6.8 2.9-6.8 7v5.2c0 2.4-.6 3.6-2 4.8" stroke-width="2"/>' +
  '<path d="M15.6 3.4c3.6 0 5.8 2.6 5.8 6.2 0 4.4-4 5.4-4 8.6a2.9 2.9 0 0 1-5.8 0" stroke-width="2"/>' +
  '<path d="M15.4 8.2a3 3 0 0 0-3 3v3.4" stroke-width="1.8"/>')

/** A nose, in profile, because face-on it reads as nothing at all. */
export const NOSE = (w: string, h: string) => svg(w, h,
  '<path d="M13.4 2.8v6.6c0 2.2 3.2 4.8 3.2 6.4 0 1.3-1.3 1.8-2.6 1.8" stroke-width="1.9"/>' +
  '<path d="M7.6 16.4c0 2.4 2.4 4.2 5 4.2" stroke-width="1.9"/>' +
  '<circle cx="10.4" cy="17.6" r="1.5" fill="currentColor" stroke="none"/>')

/** A tube of cream, squeezed. */
export const TUBE = (w: string, h: string) => svg(w, h,
  '<path d="M9.4 7.6h5.2v13.4H9.4z" stroke-width="1.9"/>' +
  '<path d="M9.4 4.4l2.6-1.6h.1l2.5 1.6v3.2H9.4z" fill="currentColor" stroke="none"/>' +
  '<path d="M10.6 11.6h2.8" stroke-width="1.9"/>')

/** A sachet, torn open at the top. */
export const SACHET = (w: string, h: string) => svg(w, h,
  '<path d="M5.4 6.6h13.2v13.8H5.4z" stroke-width="1.9"/>' +
  '<path d="M5.4 6.6l2.6-2.4 2.6 2.4 2.8-2.4 2.6 2.4 2.6-2.4v2.4z" fill="currentColor" stroke="none"/>' +
  '<path d="M8.6 13.4h6.8" stroke-width="1.9"/>')
