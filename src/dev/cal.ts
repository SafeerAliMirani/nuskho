import { renderCalibration } from '../print/calibration'
import { ensurePrintStyles } from '../print/styles'
import { setPaper } from '../paper'
setPaper({ size: 'A4', kind: 'letterhead', top: 55, bottom: 25, token: false, tokenWidth: 58 })
ensurePrintStyles()
document.getElementById('shots')!.innerHTML = renderCalibration()
;(window as any).__done = true
