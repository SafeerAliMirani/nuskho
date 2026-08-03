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



const out = document.getElementById('shots')!
;(async () => {
  const which = (location.hash || '#a4lh').slice(1)
  const P: Record<string, Paper> = {
    a4: {size:'A4', kind:'plain', top:0, bottom: 0, token: false, tokenWidth: 58 },
    a4lh: {size:'A4', kind:'letterhead', top:55, bottom: 25, token: false, tokenWidth: 58 },
  }
  setPaper(P[which] || P.a4lh)
  const d = data(8, {dx:true, tests:2, advice:2})
  const plan = await planSheets(d)
  out.innerHTML = renderSlip(d, plan)
  ;(window as any).__done = true
})()
