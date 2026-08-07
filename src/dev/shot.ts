import { planSheets } from '../print/paginate'
import { setPaper, type Paper } from '../paper'
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

function data(n: number, opt: {dx?: boolean; tests?: number; advice?: number; sent?: boolean}): SlipData {
  const lines: RxLine[] = Array.from({length:n},(_,i)=>({
    drugId:'d'+i, dose:{m:1,d:0,n:1}, meal:'after', days:5 } as RxLine))
  const visit: Visit = { id:'v', patientId:'p', createdAt: Date.parse('2026-08-01'), lines,
    diagnosis: opt.dx ? 'Hypertension' : '',
    tests: Array.from({length:opt.tests||0},(_,i)=>`Blood sugar F/R ${i+1}|رت ۾ کنڊ`),
    advice: Array.from({length:opt.advice||0},(_,i)=>`گھڻو پاڻي پيئو ${i+1}|Drink plenty of water|water`),
    sentOn: opt.sent ? { toDoctorId: 'D2', note: 'chest pain with ECG changes, please see him tonight', at: 0 } : undefined,
  } as Visit
  return { patientName:'Safeer3', patientAge:'42', patientCode:'00026', visit, drugs, rxId:'FW9SFY',
    sentTo: opt.sent ? { en: 'Room 4 \u00b7 Dr S. Soomro', sd: '\u068a\u0627\u06aa\u067d\u0631 \u0633\u0648\u0645\u0631\u0648' } : undefined } as SlipData
}



const out = document.getElementById('shots')!
;(async () => {
  const which = (location.hash || '#a4lh').slice(1)
  const P: Record<string, Paper> = {
    a4: {size:'A4', kind:'plain', top:0, bottom: 0, token: false, tokenWidth: 58 },
    a4lh: {size:'A4', kind:'letterhead', top:55, bottom: 25, token: false, tokenWidth: 58 },
    a5: {size:'A5', kind:'plain', top:0, bottom: 0, token: false, tokenWidth: 58 },
  }
  setPaper(P[which] || P.a4lh)
  // ?notot renders the sheet as it was before the chemist's total existed,
  // so the cost of that box can be counted in medicines rather than guessed
  if (location.search.includes('notot')) document.documentElement.classList.add('notot')
  const q = new URLSearchParams(location.search)
  const n = Math.max(1, Math.min(20, +(q.get('n') ?? 8) || 8))
  const d = data(n, {dx:true, tests:+(q.get('tests') ?? 2), advice:+(q.get('advice') ?? 2),
                     sent: q.has('sent')})
  const plan = await planSheets(d)
  out.innerHTML = renderSlip(d, plan)
  ;(window as any).__done = true
})()
