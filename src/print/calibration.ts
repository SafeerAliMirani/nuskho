import { paper, PAGE_MM } from '../paper'

/**
 * The calibration sheet.
 *
 * Every letterhead pad is different, and a doctor measuring his own pad with a
 * ruler in a busy clinic will get it wrong at least once — and the way it goes
 * wrong is a prescription printed across his own logo, in front of a patient.
 *
 * So he does not measure. He puts ONE of his letterheads in the tray and prints
 * this. It lays a millimetre scale down both edges of his real sheet, so he
 * reads the two numbers off his own paper, in his own printer, with whatever
 * feed offset that printer has. Then he types them into Setup once.
 *
 * Deliberately printed on the letterhead itself rather than on plain paper: a
 * scale on plain paper measures the design, this measures the design AND the
 * printer together, which is the number that actually matters.
 */
export function renderCalibration(): string {
  const { w, h } = PAGE_MM[paper().size]
  const STEP = 5                       // a mark every 5mm, numbered
  const marks: string[] = []

  for (let mm = 0; mm <= h - 8; mm += STEP) {
    const major = mm % 10 === 0
    marks.push(
      `<div class="tick ${major ? 'maj' : ''}" style="top:${mm}mm">
         <span class="l"></span>${major ? `<b class="nl">${mm}</b>` : ''}
       </div>`)
  }
  const upMarks: string[] = []
  for (let mm = 0; mm <= h - 8; mm += STEP) {
    const major = mm % 10 === 0
    upMarks.push(
      `<div class="tick r ${major ? 'maj' : ''}" style="bottom:${mm}mm">
         <span class="l"></span>${major ? `<b class="nr">${mm}</b>` : ''}
       </div>`)
  }

  return `<div class="page cal" style="width:${w}mm;height:${h}mm">
  <div class="scale left">${marks.join('')}</div>
  <div class="scale right">${upMarks.join('')}</div>
  <div class="calbody">
    <h1>Paper setup &mdash; <span class="sd">ڪاغذ جي ماپ</span></h1>
    <ol>
      <li><b>Put one of your own letterheads in the printer</b>, the same way up you
          always do. Just one sheet.<div class="sd">پنهنجو هڪ ليٽر هيڊ پرنٽر ۾ رکو.</div></li>
      <li>Print this page onto it.</li>
      <li>Look down the <b>left</b> edge. Find where your printed heading ends and
          empty paper begins. <b>Write that number down.</b>
          <div class="sd">کاٻي پاسي ڏسو &mdash; جتي توهان جي ڇپيل سِري پوري ٿئي ٿي، اهو نمبر لکو.</div></li>
      <li>Look up the <b>right</b> edge. Find where anything printed at the bottom
          begins. <b>Write that number down too.</b> If the bottom is empty, write 0.
          <div class="sd">ساڄي پاسي ڏسو &mdash; هيٺيان ڇپيل شيءِ جتان شروع ٿئي، اهو نمبر لکو.</div></li>
      <li>Type both numbers into Setup. Add <b>3&ndash;4mm</b> to each for safety.</li>
    </ol>
    <div class="warn">
      Do not measure with a ruler on a blank pad. These numbers include how your
      own printer feeds paper, which a ruler cannot know.
    </div>
    <div class="boxes2">
      <div><span>TOP &mdash; heading ends at</span><i></i><span class="u">mm</span></div>
      <div><span>BOTTOM &mdash; footer starts at</span><i></i><span class="u">mm</span></div>
    </div>
  </div>
</div>`
}

export const CALIBRATION_CSS = `
.page.cal{position:relative;background:#fff;overflow:hidden;font-family:'Liberation Sans',Arial,sans-serif;}
.page.cal .scale{position:absolute;top:0;bottom:0;width:16mm;}
.page.cal .scale.left{left:0;}
.page.cal .scale.right{right:0;}
.page.cal .tick{position:absolute;height:0;display:flex;align-items:center;gap:1mm;}
.page.cal .scale.left .tick{left:0;}
.page.cal .scale.right .tick{right:0;flex-direction:row-reverse;}
.page.cal .tick .l{display:block;width:3.5mm;height:0;border-top:.4pt solid #999;}
.page.cal .tick.maj .l{width:7mm;border-top:.8pt solid #000;}
.page.cal .tick b{font-size:6pt;font-weight:700;line-height:1;}
.page.cal .calbody{position:absolute;left:20mm;right:20mm;top:0;bottom:0;
  display:flex;flex-direction:column;justify-content:center;}
.page.cal h1{font-size:13pt;margin:0 0 3mm;}
.page.cal h1 .sd{font-family:'NK',serif;direction:rtl;unicode-bidi:isolate;}
.page.cal ol{margin:0;padding-left:5mm;font-size:8.6pt;line-height:1.5;}
.page.cal li{margin-bottom:2.4mm;}
.page.cal .sd{font-family:'NK',serif;direction:rtl;unicode-bidi:isolate;font-size:10pt;margin-top:.6mm;}
.page.cal .warn{margin-top:3mm;padding:2mm 3mm;border:.8pt solid #000;font-size:8pt;line-height:1.45;}
.page.cal .boxes2{margin-top:4mm;display:flex;gap:4mm;}
.page.cal .boxes2>div{flex:1;display:flex;align-items:center;gap:2mm;font-size:7.4pt;}
.page.cal .boxes2 i{flex:1;border-bottom:1pt solid #000;height:7mm;}
.page.cal .boxes2 .u{font-weight:700;}
`
