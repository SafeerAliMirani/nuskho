import QRCode from 'qrcode'

/**
 * The square on the slip.
 *
 * WHAT IT CARRIES, AND WHY ONLY THAT
 *
 * The patient's code and nothing else: `NUSKHO:48213`. Not the prescription,
 * not a web address.
 *
 * Not the prescription, because a second machine-readable copy of a medical
 * document can disagree with the printed one, and then somebody has to decide
 * which is real. Paper wins that argument by being the only copy. It would also
 * be a dense code, and a dense code photographed off laser toner in a dim shop
 * is a code that misreads.
 *
 * Not a web address, because that needs a server we do not have and a domain
 * that is not registered yet. A QR pointing at a domain nobody owns, printed on
 * thousands of slips, is a standing invitation to whoever registers it next.
 *
 * The prefix is what makes it safe to scan anywhere. A bare five digits could be
 * anything; `NUSKHO:` says what it is and gives us room to change the format
 * later without every old slip becoming ambiguous.
 *
 * WHO SCANS IT. The clinic's own desk. A cheap USB barcode scanner behaves as a
 * keyboard: point it at a returning patient's slip and the code appears in the
 * search box, no software, no internet, no typing mistakes. That is the entire
 * feature, and it is worth having.
 */

export const QR_PREFIX = 'NUSKHO:'

/** What goes inside the square. */
export const qrPayload = (code: string) => QR_PREFIX + code.replace(/[^A-Za-z0-9]/g, '')

/** And what comes back out of a scanner, which types it like a keyboard. */
export function readQrPayload(scanned: string): string | null {
  const s = scanned.trim()
  if (s.toUpperCase().startsWith(QR_PREFIX)) return s.slice(QR_PREFIX.length).trim()
  // a scanner configured without a prefix, or a person typing: still accept digits
  return /^\d{4,6}$/.test(s) ? s : null
}

/**
 * An SVG string, built by hand rather than by the library's own renderer.
 *
 * Reasons, all of them about printing:
 *   - it is SYNCHRONOUS, and the slip renderer builds an HTML string in one pass
 *   - one <path> for all the dark modules, so the printer driver gets a few
 *     hundred bytes instead of four hundred rectangles
 *   - `shape-rendering="crispEdges"`, because an anti-aliased QR module at 300dpi
 *     is a grey edge, and grey edges are what a cheap phone camera fails on
 *   - pure black, no opacity, no gradient. A laser printer has one ink.
 */
export function qrSvg(code: string, mm = 14): string {
  const q = QRCode.create(qrPayload(code), { errorCorrectionLevel: 'M' })
  const n = q.modules.size
  let d = ''
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (q.modules.get(x, y)) d += `M${x} ${y}h1v1h-1z`
    }
  }
  // no quiet zone in the viewBox: the slip supplies white space around it, and
  // a padded viewBox would shrink the modules inside a fixed millimetre square
  return `<svg class="qr" width="${mm}mm" height="${mm}mm" viewBox="0 0 ${n} ${n}" `
       + `shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" role="img" `
       + `aria-label="patient code ${code}">`
       + `<rect width="${n}" height="${n}" fill="#fff"/>`
       + `<path d="${d}" fill="#000"/></svg>`
}

/**
 * Safe for the print path.
 *
 * A prescription must print even if this file has a bad day. If the encoder
 * throws on some code we did not anticipate, the slip loses a small square in
 * the corner and the patient still walks out with his medicines.
 */
export function qrSvgSafe(code: string, mm = 14): string {
  try {
    return code ? qrSvg(code, mm) : ''
  } catch {
    return ''
  }
}
