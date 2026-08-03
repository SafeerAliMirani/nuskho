import { renderToken, TOKEN_CSS } from '../print/token'
import fontsCss from '../print/fonts.css?raw'
const st = document.createElement('style'); st.textContent = fontsCss + TOKEN_CSS
document.head.appendChild(st)
const base = { patientName: 'Bakhtawar Khatoon', patientCode: '48213', at: Date.parse('2026-08-03T18:42:00') }
document.getElementById('a')!.innerHTML = renderToken({ ...base, token: 23, fee: 300, feeState: 'paid' }, 58)
document.getElementById('b')!.innerHTML = renderToken({ ...base, token: 24, fee: 0, feeState: 'waived' }, 80)
