import { renderFitted } from '../print/paginate'
import { ensurePrintStyles } from '../print/styles'
import { setPaper } from '../paper'
import { saveProfile } from '../profile'
import type { Drug, RxLine, Visit } from '../types'
import type { SlipData } from '../print/renderSlip'

const D: Record<string, Drug> = {}
;[['AUGMENTIN','625 mg','Amoxicillin + clavulanic acid','اوگمينتن','tab'],
  ['PANADOL','500 mg','Paracetamol','پينادول','tab'],
  ['RISEK','20 mg','Omeprazole','رانسيڪ','cap'],
  ['BROFEX','syrup','Guaifenesin','بروفيڪس','syr']]
  .forEach(([b,s,g,sd,f],i)=>{ D['d'+i]={id:'d'+i,brand:b,strength:s,generic:g,sd,sdReviewed:true,
    form:f as Drug['form'],unitSd:f==='syr'?'چمچو':f==='cap'?'ڪيپسول':'گوري'} as Drug })

;(async () => {
  saveProfile({ doctorEn:'Dr. Physician', doctorSd:'ڊاڪٽر', degreesEn:'M.B.B.S. — Physician',
    degreesSd:'ايم بي بي ايس', reg:'', addressEn:'Clinic Road, Larkana',
    timing:'5:00 pm – 10:00 pm', logoMm:16, showCredit:true, showQr:true, showSign:false,
    phone:'0300 0000000',
    fee:300, ready:true } as never)
  setPaper({ size:'A5', kind:'plain', top:0, bottom:0, token:false, tokenWidth:58 })
  ensurePrintStyles()
  const n = +(new URLSearchParams(location.search).get('n') ?? '0')
  const lines: RxLine[] = Array.from({length:n},(_,i)=>({
    drugId:'d'+(i%4), dose:{m:1,d:0,n:1}, meal:'after', days:5 } as RxLine))
  const visit = { id:'v', patientId:'p', token:42, status:'waiting', createdAt:Date.parse('2026-08-03'),
    lines, tests:[], advice:[], diagnosis:'High blood pressure',
    vitals:{ bp:'150/95', pulse:'88', temp:'98.4', weight:'72', rbs:'186', hba1c:'7.4' } } as unknown as Visit
  const d: SlipData = { visit, patientName:'Bakhtawar Khatoon', patientAge:'42', patientSex:'F',
    patientCode:'00042', drugs:D, rxId:'U3ZO76' }
  document.getElementById('print-root')!.innerHTML = await renderFitted(d)
  document.title = 'ready'
})()
