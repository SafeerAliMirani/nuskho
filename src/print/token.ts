import { profile, APP } from '../profile'
import { qrSvgSafe } from './qr'

/**
 * The counter receipt.
 *
 * In Larkana the money moves first: the patient pays at the desk, gets a number,
 * and waits. Until now that number existed only on a screen and in somebody's
 * memory. This prints it.
 *
 * THE ONE RULE THIS FILE ENFORCES
 *
 * A fee may appear here. A medicine may not, ever, and neither may a diagnosis,
 * a test or a count of any of them. The prescription is a clinical document and
 * carries no money; the token is a financial document and carries no medicine.
 * Two streams, one artifact each. That is the whole reason it was safe to put a
 * rupee figure on paper at all, and the moment something clinical is added here
 * for convenience the argument collapses.
 *
 * THE PRINTER IS NEVER LOAD-BEARING
 *
 * The token number is issued and shown on screen whether or not this prints.
 * Out of paper, unplugged, driver asleep: the evening continues and somebody
 * writes the number on a pad. Nothing in the queue, the fee record or the
 * prescription depends on a receipt having come out. If a thermal failure can
 * ever stop a prescription printing, the integration is wrong.
 *
 * HOW IT REACHES THE PRINTER
 *
 * As an ordinary print job at a narrow page size, not as ESC/POS bytes. Every
 * thermal printer worth buying installs as a Windows printer and accepts one.
 * That means no drivers of ours, no WebUSB, no permissions prompt, and the same
 * kiosk-printing path the slip already uses.
 */

export interface TokenSlip {
  token: number
  patientName: string
  patientCode: string
  /** what the counter actually took, in rupees. 0 prints as free, not as blank. */
  fee: number
  /** free means the doctor waived it in advance; due means he is being seen first */
  feeState: 'paid' | 'waived' | 'due'
  at: number
}

/** Paper width in millimetres. 58 and 80 are the two rolls anyone sells. */
export type TokenWidth = 58 | 80

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

const two = (n: number) => String(n).padStart(2, '0')

function when(at: number): string {
  const d = new Date(at)
  const h = d.getHours()
  return `${two(d.getDate())}/${two(d.getMonth() + 1)}/${d.getFullYear()} `
       + `${two(h % 12 || 12)}:${two(d.getMinutes())} ${h < 12 ? 'am' : 'pm'}`
}

export function renderToken(t: TokenSlip, width: TokenWidth = 58): string {
  const dr = profile()
  const money =
    t.feeState === 'waived' ? 'FREE &nbsp; مفت'
    : t.feeState === 'due' ? 'TO PAY &nbsp; ادا ڪرڻي آهي'
    : `Rs ${t.fee.toLocaleString('en-PK')}`

  // No phone number and no address: a receipt travels further than a slip, and
  // the standing rule is that a number we do not control never gets printed.
  return `<div class="tok w${width}">
  <div class="tk-top">
    <b>${esc(dr.doctorEn || APP.en)}</b>
    ${dr.degreesEn ? `<small>${esc(dr.degreesEn)}</small>` : ''}
    ${dr.doctorSd ? `<div class="sd">${esc(dr.doctorSd)}</div>` : ''}
  </div>

  <div class="tk-no">
    <span>YOUR NUMBER &nbsp; <i class="sd">نمبر</i></span>
    <b>${t.token}</b>
  </div>

  <div class="tk-rows">
    <div><span>Name <i class="sd">نالو</i></span><b>${esc(t.patientName)}</b></div>
    <div><span>Patient no. <i class="sd">مريض نمبر</i></span><b class="sp">${esc(t.patientCode)}</b></div>
    <div><span>Date <i class="sd">تاريخ</i></span><b>${when(t.at)}</b></div>
  </div>

  <div class="tk-fee">
    <span>FEE &nbsp; <i class="sd">في</i></span>
    <b>${money}</b>
  </div>

  ${t.patientCode ? `<div class="tk-qr">${qrSvgSafe(t.patientCode, width === 80 ? 20 : 16)}</div>` : ''}

  <div class="tk-foot">
    Keep this slip until you are called.
    <div class="sd">پنهنجو نمبر سڏجڻ تائين هي پرچي پاڻ وٽ رکو</div>
  </div>
</div>`
}

/**
 * Its own stylesheet, deliberately not sharing one line with slip.css.
 *
 * Thermal paper is not paper. It is 58 or 80 millimetres wide with no margin to
 * speak of, it has one ink and no greys, it is read at arm's length in a noisy
 * room, and it fades within months. So: heavy weights, real black, big number,
 * nothing hairline, and nothing that assumes the reader will squint.
 */
export const TOKEN_CSS = `
.tok{font-family:'NK',-apple-system,'Segoe UI',system-ui,Arial,sans-serif;color:#000;
  padding:2mm 2mm 4mm;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.tok.w58{width:54mm;font-size:8.5pt;}
.tok.w80{width:74mm;font-size:9.5pt;}
.tok .sd{font-family:'NK',serif;direction:rtl;unicode-bidi:isolate;}

.tok .tk-top{padding-bottom:1.6mm;border-bottom:1.2pt solid #000;}
.tok .tk-top b{display:block;font-size:11pt;line-height:1.2;}
.tok.w80 .tk-top b{font-size:12.5pt;}
.tok .tk-top small{display:block;font-size:7pt;margin-top:.4mm;}
.tok .tk-top .sd{font-size:10pt;margin-top:.6mm;}

/* the number is the entire point of the piece of paper */
.tok .tk-no{margin:2.4mm 0;}
.tok .tk-no span{display:block;font-size:6.6pt;letter-spacing:1.4px;}
.tok .tk-no b{display:block;font-size:40pt;line-height:1;font-weight:800;letter-spacing:-1px;}
.tok.w80 .tk-no b{font-size:52pt;}

.tok .tk-rows{border-top:.8pt dashed #000;border-bottom:.8pt dashed #000;padding:1.4mm 0;text-align:left;}
.tok .tk-rows>div{display:flex;justify-content:space-between;gap:2mm;align-items:baseline;padding:.5mm 0;}
.tok .tk-rows span{font-size:6.8pt;white-space:nowrap;}
.tok .tk-rows b{font-size:8.5pt;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.tok .tk-rows b.sp{letter-spacing:1.6px;}
.tok .tk-rows i{font-style:normal;font-size:7.4pt;}

.tok .tk-fee{margin:2mm 0 1.6mm;padding:1.4mm 0;border:1.4pt solid #000;}
.tok .tk-fee span{display:block;font-size:6.6pt;letter-spacing:1.2px;}
.tok .tk-fee b{display:block;font-size:15pt;font-weight:800;line-height:1.25;}
.tok .tk-fee i{font-style:normal;}

.tok .tk-qr{margin:1.6mm 0 1mm;}
.tok .tk-qr svg{display:block;margin:0 auto;}

.tok .tk-foot{font-size:6.6pt;line-height:1.5;padding-top:1.2mm;border-top:.8pt dashed #000;}
.tok .tk-foot .sd{font-size:8.5pt;margin-top:.6mm;}
`
