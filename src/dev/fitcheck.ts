import { planSheets } from '../print/paginate'
import { setPaper, PAGE_MM, type Paper } from '../paper'
import { renderSlip, type SlipData } from '../print/renderSlip'
import type { Drug, RxLine, Visit } from '../types'

const NAMES: [string,string,string,string][] = [
  ['RISEK 20 mg','Omeprazole','رانسيڪ','ڪيپسول'],
  ['MOTILIUM 10 mg','Domperidone','موتيليم','گوري'],
  ['BROFEX syrup','Guaifenesin','بروفيڪس','چمچو'],
  ['CALPOL syrup','Paracetamol','ڪالپول','چمچو'],
  ['CIPROXIN 500 mg','Ciprofloxacin','سپروڪسن','گوري'],
  ['PANADOL 500 mg','Paracetamol','پينادول','گوري'],
  ['FLAGYL 400 mg','Metronidazole','فليجل','گوري'],
  ['AUGMENTIN 625 mg','Amoxicillin + Clavulanic acid','اوگمينتن','گوري'],
  ['ZYRTEC 10 mg','Cetirizine','زرٽيڪ','گوري'],
  ['RIGIX 10 mg','Levocetirizine','رجڪس','گوري'],
  ['NIMS 100 mg','Nimesulide','نمس','گوري'],
  ['VENTOLIN','Salbutamol','وينٽولن','گوري'],
]
const drugs: Record<string, Drug> = {}
NAMES.forEach(([b,g,sd,u],i)=>{ drugs['d'+i] = { id:'d'+i, brand:b.split(' ')[0], strength:b.split(' ').slice(1).join(' '), generic:g, sd, sdReviewed:true, unitEn:'tablet', unitSd:u , form: (b.includes('syrup')?'syr':i===0?'cap':'tab') } as Drug })

function data(n: number, opt: {dx?: boolean; tests?: number; advice?: number}): SlipData {
  const lines: RxLine[] = Array.from({length:n},(_,i)=>({
    drugId:'d'+i, dose:{m:1,d:0,n:1}, meal:'after', days:5 } as RxLine))
  const visit: Visit = { id:'v', patientId:'p', createdAt: Date.parse('2026-08-01'), lines,
    diagnosis: opt.dx ? 'Hypertension' : '',
    tests: Array.from({length:opt.tests||0},(_,i)=>`Blood sugar F/R ${i+1}|رت ۾ کنڊ`),
    advice: Array.from({length:opt.advice||0},(_,i)=>`گھڻو پاڻي پيئو ${i+1}|Drink plenty of water|water`),
  } as Visit
  return { patientName:'Safeer3', patientAge:'42', patientCode:'00026', visit, drugs, rxId:'FW9SFY' } as SlipData
}


const PAPERS: [string, Paper][] = [
  ['A5 plain            ', {size:'A5', kind:'plain',      top:0,  bottom:0, token:false, tokenWidth:58}],
  ['A4 plain            ', {size:'A4', kind:'plain',      top:0,  bottom:0, token:false, tokenWidth:58}],
  ['A4 letterhead 55/25 ', {size:'A4', kind:'letterhead', top:55, bottom:25, token:false, tokenWidth:58}],
  ['A4 letterhead 70/40 ', {size:'A4', kind:'letterhead', top:70, bottom:40, token:false, tokenWidth:58}],
  ['A5 letterhead 40/15 ', {size:'A5', kind:'letterhead', top:40, bottom:15, token:false, tokenWidth:58}],
]
const SETS: [string, any][] = [
  ['5 meds + dx',            data(5,{dx:true})],
  ['8 meds + dx + 2t + 2a',  data(8,{dx:true,tests:2,advice:2})],
  ['12 meds + dx + 2t + 2a', data(12,{dx:true,tests:2,advice:2})],
]
const out = document.getElementById('out')!
;(async () => {
  const host = document.createElement('div')
  host.style.cssText='position:fixed;left:-30000px;top:0'
  document.body.appendChild(host)
  const rows: string[] = []
  for (const [pl, pp] of PAPERS) {
    setPaper(pp)
    host.style.width = PAGE_MM[pp.size].w + 'mm'
    for (const [label, d] of SETS) {
      const plan = await planSheets(d)
      host.innerHTML = renderSlip(d, plan)
      const pages = Array.from(host.querySelectorAll<HTMLElement>('.page'))
      const clr = pages.map(p => {
        const foot = p.querySelector<HTMLElement>('.foot')!
        const pad  = p.querySelector<HTMLElement>('.pad')!
        let b = pad.getBoundingClientRect().top
        for (const el of Array.from(pad.children) as HTMLElement[])
          if (el.getClientRects().length) b = Math.max(b, el.getBoundingClientRect().bottom)
        return Math.round(foot.getBoundingClientRect().top - b)
      })
      // on a letterhead nothing at all may enter the doctor's own bands
      let intrude = 'ok'
      if (pp.kind === 'letterhead') {
        const bad = pages.map(p => {
          const r = p.getBoundingClientRect()
          const mmpx = r.height / PAGE_MM[pp.size].h
          const topLimit = r.top + pp.top * mmpx - 1
          const botLimit = r.bottom - pp.bottom * mmpx + 1
          const els = [...p.querySelectorAll<HTMLElement>('.pad > *, .foot, .hdr')]
          return els.some(e => { const b = e.getBoundingClientRect()
            return e.getClientRects().length && (b.top < topLimit || b.bottom > botLimit) })
        })
        intrude = bad.some(Boolean) ? '*** INTRUDES ON LETTERHEAD ***' : 'ok'
      }
      rows.push(`${pl} ${label.padEnd(24)} sheets=${pages.length} ${JSON.stringify(plan.groups)} ${plan.compact?'cmp':'cmf'} clr=${JSON.stringify(clr)} ${clr.every(v=>v>=0)?'':'*** COLLIDES ***'} ${intrude}`)
    }
  }
  out.textContent = rows.join('\n')
  ;(window as any).__done = true
})()
