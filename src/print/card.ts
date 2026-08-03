import { queuedPrint } from './print'
import { paper, PAGE_MM } from '../paper'
import { profile, APP } from '../profile'
import type { Stats } from '../stats'

/**
 * The month card — the one thing here that is meant to leave the clinic.
 *
 * It is drawn from a WHITELIST. Not "the dashboard with the private parts
 * hidden": a separate artifact that is structurally incapable of carrying a
 * rupee figure, a medicine name, a village name or a patient. If someone
 * forwards it around Larkana on WhatsApp — and they will — nothing in it can
 * hurt a patient or embarrass the doctor.
 *
 * Money is absent on purpose and permanently. A picture of a doctor's monthly
 * earnings circulating in a small town is a robbery risk, a jealousy engine and
 * a way to look mercenary to every patient who sees it forwarded. There is no
 * version of sharing that which ends well.
 *
 * The hero number is people served, with people who came back beside it.
 * Volume alone would reward speed; a returning patient is the closest thing
 * this data has to evidence of care.
 *
 * Drawn on a canvas rather than as HTML so that one renderer serves the screen
 * preview, the WhatsApp-sized PNG and the printed copy — and so it works with
 * no network and no libraries.
 */

export const CARD_W = 1080
export const CARD_H = 1528          // A5 proportions, WhatsApp-friendly

/** Everything the card is allowed to know. Nothing else is passed in. */
export type CardData = {
  doctorEn: string
  doctorSd: string
  degreesEn: string
  clinic: string
  monthLabel: string
  patientsMonth: number
  patientsLifetime: number
  returningPct: number
  returningN: number
  placeCount: number
  /** only broad, non-stigmatising categories, and only when large enough */
  topDiagnoses: { label: string; n: number }[]
  sinceLabel?: string
  credit: boolean
}

/** The whitelist, applied once, here. */
export function cardData(s: Stats): CardData {
  const p = profile()
  return {
    doctorEn: p.doctorEn || 'Doctor',
    doctorSd: p.doctorSd || '',
    degreesEn: p.degreesEn || '',
    clinic: p.addressEn || '',
    monthLabel: s.monthLabel,
    patientsMonth: s.month,
    patientsLifetime: s.lifetime,
    returningPct: s.returningPct,
    returningN: s.returningN,
    placeCount: s.placeCount,
    // 25 is the floor: below it a "case" in a town this size is a person
    topDiagnoses: s.diagnoses
      .filter(d => d.label !== 'Not recorded' && !d.label.startsWith('Other') && d.n >= 25)
      .slice(0, 3).map(d => ({ label: d.label, n: d.n })),
    sinceLabel: s.since
      ? new Date(s.since).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
      : undefined,
    credit: p.showCredit,
  }
}

const GREEN = '#0f5c4a'
const INK = '#12211d'
const MUT = '#6b7a76'

const nf = (n: number) => n.toLocaleString('en-GB')

export async function drawCard(c: HTMLCanvasElement, d: CardData): Promise<void> {
  c.width = CARD_W; c.height = CARD_H
  const x = c.getContext('2d')!
  // the Sindhi face has to be resident before anything is drawn, or the name
  // silently falls back to a Latin font and renders as boxes
  try { await (document as any).fonts?.load('700 44px NK'); await (document as any).fonts?.ready }
  catch { /* proceed with whatever is available */ }

  x.fillStyle = '#fff'; x.fillRect(0, 0, CARD_W, CARD_H)

  const M = 82
  const mid = CARD_W / 2
  const centre = (t: string, y: number, font: string, col = INK) => {
    x.font = font; x.fillStyle = col; x.textAlign = 'center'; x.fillText(t, mid, y)
  }

  /* --- letterhead. It should read as a certificate of service, which is what
         a doctor puts on a clinic wall, not as a software dashboard. --- */
  x.fillStyle = GREEN; x.fillRect(0, 0, CARD_W, 14)
  centre(d.doctorEn, 132, '700 52px "Liberation Sans", Arial, sans-serif')
  if (d.doctorSd) centre(d.doctorSd, 196, '700 46px NK, serif')
  if (d.degreesEn) centre(d.degreesEn, 246, '400 26px "Liberation Sans", Arial, sans-serif', MUT)
  if (d.clinic) centre(d.clinic, 286, '400 24px "Liberation Sans", Arial, sans-serif', MUT)

  x.strokeStyle = '#e2e8e6'; x.lineWidth = 2
  x.beginPath(); x.moveTo(M, 330); x.lineTo(CARD_W - M, 330); x.stroke()

  /* --- the hero: people, not money and not speed --- */
  centre(d.monthLabel.toUpperCase(), 396, '700 26px "Liberation Sans", Arial, sans-serif', GREEN)

  x.font = '700 190px "Liberation Sans", Arial, sans-serif'
  x.fillStyle = GREEN; x.textAlign = 'center'
  x.fillText(nf(d.patientsMonth), mid, 570)
  centre('patients served', 626, '400 34px "Liberation Sans", Arial, sans-serif', INK)
  centre('مريضن جي خدمت', 678, '700 36px NK, serif', MUT)

  /* --- the two supporting figures. Returning patients sit here on purpose:
         it is the only number that rewards care rather than throughput. --- */
  const boxY = 748, boxH = 210
  const cells: [string, string, string][] = [
    [nf(d.patientsLifetime), 'patients in all', d.sinceLabel ? `since ${d.sinceLabel}` : ''],
    [`${d.returningPct}%`, 'came back to you', `${nf(d.returningN)} returning visits`],
  ]
  const cw = (CARD_W - M * 2) / cells.length
  cells.forEach(([big, lab, sub], i) => {
    const cx = M + cw * i + cw / 2
    x.textAlign = 'center'
    x.font = '700 76px "Liberation Sans", Arial, sans-serif'; x.fillStyle = INK
    x.fillText(big, cx, boxY + 84)
    x.font = '400 27px "Liberation Sans", Arial, sans-serif'; x.fillStyle = INK
    x.fillText(lab, cx, boxY + 130)
    if (sub) {
      x.font = '400 22px "Liberation Sans", Arial, sans-serif'; x.fillStyle = MUT
      x.fillText(sub, cx, boxY + 168)
    }
  })
  x.strokeStyle = '#e2e8e6'
  x.beginPath(); x.moveTo(mid, boxY + 20); x.lineTo(mid, boxY + boxH - 30); x.stroke()
  x.beginPath(); x.moveTo(M, boxY + boxH); x.lineTo(CARD_W - M, boxY + boxH); x.stroke()

  /* --- villages served: a superb thing to be proud of that names nobody --- */
  let y = boxY + boxH + 86
  if (d.placeCount > 0) {
    centre(`from ${nf(d.placeCount)} ${d.placeCount === 1 ? 'town or village' : 'towns and villages'}`,
      y, '400 34px "Liberation Sans", Arial, sans-serif', INK)
    y += 74
  }

  /* --- broad categories only, and only when they are large enough that no
         single person is standing behind the number --- */
  if (d.topDiagnoses.length) {
    centre('MOST TREATED THIS MONTH', y, '700 22px "Liberation Sans", Arial, sans-serif', MUT)
    y += 52
    for (const t of d.topDiagnoses) {
      x.textAlign = 'left'
      x.font = '400 30px "Liberation Sans", Arial, sans-serif'; x.fillStyle = INK
      x.fillText(t.label, M + 40, y)
      x.textAlign = 'right'
      x.font = '700 30px "Liberation Sans", Arial, sans-serif'; x.fillStyle = GREEN
      x.fillText(nf(t.n), CARD_W - M - 40, y)
      y += 48
    }
  }

  /* --- foot --- */
  x.strokeStyle = '#e2e8e6'
  x.beginPath(); x.moveTo(M, CARD_H - 128); x.lineTo(CARD_W - M, CARD_H - 128); x.stroke()
  centre('No patient information appears on this card.',
    CARD_H - 86, '400 21px "Liberation Sans", Arial, sans-serif', MUT)
  if (d.credit) {
    centre(`${APP.sd}  ${APP.en} · ${APP.web}`,
      CARD_H - 46, '400 21px NK, "Liberation Sans", serif', '#9aa8a4')
  }
  x.fillStyle = GREEN; x.fillRect(0, CARD_H - 14, CARD_W, 14)
}

export function cardFilename(d: CardData): string {
  const who = d.doctorEn.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()
  const m = d.monthLabel.replace(/\s+/g, '-').toLowerCase()
  return `nuskho-${who}-${m}.png`
}

export async function downloadCard(d: CardData): Promise<void> {
  const c = document.createElement('canvas')
  await drawCard(c, d)
  const a = document.createElement('a')
  a.href = c.toDataURL('image/png')
  a.download = cardFilename(d)
  a.click()
}

/** Printed, because a card on the clinic wall is the best advertising there is. */
export async function printCard(d: CardData): Promise<void> {
  const c = document.createElement('canvas')
  await drawCard(c, d)
  const png = c.toDataURL('image/png')
  // Through the queue, and at THIS clinic's paper size. It used to hard-code
  // A5 into the page box while `@page` still said whatever the clinic prints
  // on, so on an A4 clinic the card came out small in the corner of a big sheet.
  const { w, h } = PAGE_MM[paper().size]
  await queuedPrint(() => `<div class="page" style="--pw:${w}mm;--ph:${h}mm;display:flex;
      align-items:center;justify-content:center;overflow:hidden">
      <img src="${png}" style="width:${Math.round(w * 0.92)}mm;height:auto;display:block">
    </div>`)
}
