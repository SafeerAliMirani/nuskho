import { useEffect, useRef, useState } from 'react'
import { IcClock, IcCalendar, IcHeart, IcMoney, ArtNoFigures } from '../ui/art'
import { Note } from '../ui/Note'
import { computeStats, MIN_CELL, MIN_TREND, type Stats, type Bar } from '../stats'
import { cardData, drawCard, downloadCard, printCard, CARD_W, CARD_H } from '../print/card'
import { ensurePrintStyles } from '../print/styles'
import { role, currentDoctorId } from '../roles'
import { multiRoom, doctorById } from '../doctors'

/**
 * The doctor's own figures.
 *
 * This screen is a mirror, not a trophy. Money and medicines live here and
 * nowhere else; the thing meant for sharing is the month card, which is drawn
 * from a separate whitelist and cannot contain either.
 *
 * The two headline numbers are people served and people who came back —
 * deliberately, because a page that celebrates patients-per-hour is a page that
 * quietly argues for shorter consultations. No streaks, no records, no
 * projections, no "on track for". A record evening is a hundred and forty tired
 * people in a queue, not an achievement to decorate.
 */
export default function StatsScreen({ onBack }: { onBack: () => void }) {
  const [s, setS] = useState<Stats | null>(null)
  const [showMeds, setShowMeds] = useState(false)
  const [showDue, setShowDue] = useState(false)
  const [card, setCard] = useState(false)

  // In a building with several rooms these are HIS figures, not the machine's:
  // the mirror scopes itself to the doctor who signed in at the door.
  const mine = multiRoom() && role() === 'doctor' ? currentDoctorId() ?? undefined : undefined
  useEffect(() => { computeStats(mine).then(setS) }, [mine])
  if (!s) return <div className="pane">Counting…</div>

  const empty = s.lifetime === 0

  return (
    <div className="pane stats">
      <button className="btn ghost" onClick={onBack}>&larr; Queue</button>

      {s.clockOdd && (
        <p className="usable bad">
          Some visits are dated in the future or impossibly early. Check this computer's
          clock. Everything below depends on it.
        </p>
      )}

      {empty ? (
        <div className="blank">
          <ArtNoFigures />
          <b>Nothing to count yet</b>
          <p>Print a few prescriptions and this page fills itself in.</p>
        </div>
      ) : (
        <>
          {/* The headline pair, exactly as the Mirror design frames it: volume,
              and the closest thing this data has to evidence of care. */}
          <div className="mheroes">
            <div className="mh">
              <small>People served <i className="sd">ماڻهو</i></small>
              <b>{s.month.toLocaleString('en-GB')}</b>
              <span>in {s.monthLabel} · {s.today} today</span>
              {/* the shape of the month behind the number it belongs to: the
                  stat-tile-with-trend pattern, not a second chart */}
              <Spark rows={s.byEvening} />
            </div>
            <div className="mh">
              <small>People who came back</small>
              <b>{s.returningN.toLocaleString('en-GB')}</b>
              <span>{s.returningPct}% of the month · {s.loyalN} on a third visit or more</span>
            </div>
            <div className="mh alt">
              <small>Evenings worked</small>
              <b>{s.evenings}</b>
              <span>{s.lifetime.toLocaleString('en-GB')} people in all{s.since
                ? `, since ${new Date(s.since).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}` : ''}</span>
            </div>
          </div>

          {s.thin && (
            <Note tone="info" title="Too few visits to read anything into">
              Fewer than {MIN_TREND} this month. Small numbers move a lot on their own,
              so this is weather and not climate.
            </Note>
          )}

          {/* ---- money. Private. Never on the card, never in an export. ---- */}
          <h2><IcMoney size={17} /> Fees this month</h2>
          <div className="tiles money">
            <Tile big={`Rs ${s.received.toLocaleString('en-GB')}`} lab="received"
                  tone="k" icon={IcMoney} cap="in hand"
                  sub={s.refunded > 0 ? `after Rs ${s.refunded.toLocaleString('en-GB')} given back on your word` : ''} />
            <Tile big={`Rs ${s.dueTotal.toLocaleString('en-GB')}`} lab="still due"
                  tone={s.dueTotal > 0 ? 'w' : undefined} icon={IcClock} cap="owed"
                  sub={s.due.length ? `${s.due.length} patients` : 'nobody owes anything'} />
            <Tile big={s.waivedCount} lab="seen free" sub="fee waived" icon={IcHeart} cap="waived" />
          </div>
          {s.due.length > 0 && (
            <>
              <button className="lnk" onClick={() => setShowDue(v => !v)}>
                {showDue ? 'hide' : 'show'} who still owes
              </button>
              {showDue && (
                <div className="druglist" style={{ marginTop: 8 }}>
                  {s.due.map((d, i) => (
                    <div className="drow" key={i}>
                      <b>{d.name}</b>
                      <span>no. {d.code}</span>
                      <span>{new Date(d.at).toLocaleDateString('en-GB')}</span>
                      <b>Rs {d.amount}</b>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {s.feeUnrecorded > 0 && (
            <p className="hint">
              {s.feeUnrecorded} visits this month have no fee recorded at all. That is not the
              same as free, and the figures above do not include them.
            </p>
          )}

          {/* ---- the rhythm: plain counts per evening, nothing cleverer ---- */}
          {s.byEvening.length > 1 && (
            <>
              <h2><IcCalendar size={17} /> Patients per evening</h2>
              <Columns rows={s.byEvening} />
              <p className="hint">This month, day by day. Counts only: no projections, no
                smoothing, no trend arrows. The busiest evening carries its number.</p>
            </>
          )}

          {/* ---- the queue ---- */}
          <h2>The evening</h2>
          <div className="tiles">
            <Tile big={s.leftN} lab="left without being seen" sub={`${s.leftPct}% of this month`}
                  warn={s.leftPct > 10} />
            <Tile big={s.referredN} lab="sent on or emergency" />
            <Tile big={s.seenOnlyN} lab="seen, no medicine needed" />
            <Tile big={s.cancelledN} lab="cancelled" />
          </div>

          {s.byHour.length > 0 && (
            <>
              <h3>When they arrive <small>last four weeks</small></h3>
              {s.hoursUnreliable ? (
                <p className="hint">
                  Many tokens are issued in batches at the door, so arrival times cluster and
                  this chart would show when the compounder was typing, not when patients came.
                  Not shown.
                </p>
              ) : (
                <div className="hours">
                  {s.byHour.map(h => {
                    const max = Math.max(...s.byHour.map(z => z.arrived)) || 1
                    return (
                      <div className="hbar" key={h.hour}>
                        <div className="col">
                          <div className="fill" style={{ height: `${(h.arrived / max) * 100}%` }}>
                            {h.left > 0 && (
                              <div className="lost" style={{ height: `${(h.left / h.arrived) * 100}%` }} />
                            )}
                          </div>
                        </div>
                        <span className="n">{h.arrived}</span>
                        <span className="hl">{String(h.hour).padStart(2, '0')}</span>
                      </div>
                    )
                  })}
                </div>
              )}
              {!s.hoursUnreliable && s.leftN > 0 && (
                <p className="hint"><i className="swatch" /> the darker part is patients who left
                  without being seen. If it piles up late, that is a staffing decision, not a statistic.</p>
              )}
              {s.busiestDay && <p className="hint">Busiest day overall: <b>{s.busiestDay}</b>.</p>}
            </>
          )}

          {/* ---- clinical. Never crossed with a place, an age or a sex. ---- */}
          <h2>What you treated in {s.monthLabel}</h2>
          <Bars rows={s.diagnoses} />
          <p className="hint">
            A diagnosis was recorded on {s.dxRecordedPct}% of visits. Anything seen fewer than
            {' '}{MIN_CELL} times is pooled, so that no single person can be picked out of this.
          </p>

          <h2>Where they travelled from</h2>
          <p className="tilebig">{s.placeCount} <small>towns and villages</small></p>
          <Bars rows={s.places} />
          <p className="hint">
            This says where <b>your patients</b> came from. It does not say anything about
            illness in those places, and it is never joined to the chart above.
          </p>

          <h2>Medicines</h2>
          <p className="hint">
            By generic name, and private. Brand-level prescribing figures are exactly what drug
            companies buy, so this app does not produce them. This list is on no card,
            no print and no export.
          </p>
          <button className="lnk" onClick={() => setShowMeds(v => !v)}>
            {showMeds ? 'hide' : 'show'} the list
          </button>
          {showMeds && (
            <>
              <Bars rows={s.medicines} />
              <p className="hint">Average <b>{s.avgMedicines}</b> medicines on a prescription.</p>
            </>
          )}

          {/* ---- the shareable thing ---- */}
          <h2>Your month card</h2>
          <p className="hint">
            One page you can print for the clinic wall or send on WhatsApp. It carries your name,
            how many people you served and how many came back, and <b>no money, no medicines and
            no patient</b>, by design rather than by cropping.
          </p>
          <button className="btn wide" onClick={() => setCard(true)}>See the card</button>
          {card && <CardView s={s} onClose={() => setCard(false)} />}

          <div className="refuse">
            <b>What this page refuses to show, on purpose.</b>
            <p>No patients per hour, no average consultation time, no revenue per patient,
              no streaks, no personal bests, no projections, and no comparison with any
              other doctor. A page that celebrates speed quietly argues for shorter
              consultations, and this one will not.</p>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * A tile carries a colour and an icon now, and both mean something.
 *
 * A wall of identical white boxes with green numbers tells a reader that every
 * figure is equally important, which is the same as telling them nothing is.
 * Money received is green, money owed is amber, and the month is the hero.
 */
function Tile({ big, lab, sd, sub, hero, warn, tone, icon: I, cap }: {
  big: number | string; lab: string; sd?: string; sub?: string
  hero?: boolean; warn?: boolean; tone?: 'i' | 'k' | 'w' | 'e'
  icon?: (p: { size?: number }) => JSX.Element; cap?: string
}) {
  return (
    <div className={'tile' + (hero ? ' hero' : '') + (warn ? ' warn' : '') + (tone ? ' ' + tone : '')}>
      {(I || cap) && <div className="ti">{I && <I size={14} />}{cap}</div>}
      <b>{typeof big === 'number' ? big.toLocaleString('en-GB') : big}</b>
      <span>{lab}{sd ? <i className="sd"> {sd}</i> : null}</span>
      {sub && <small>{sub}</small>}
    </div>
  )
}

/**
 * RANKED BARS: ONE MEASURE, ONE HUE, THE NUMBER AT THE TIP.
 *
 * Magnitude low-to-high is the plainest job a chart has, and the plainest form
 * answers it: a single hue, a recessive track, the value beside the end of the
 * bar rather than a number floating on every gridline. No pie, because a pie
 * asks the reader to compare angles; no legend, because one series needs none —
 * the heading above already says what is being counted.
 *
 * The bar is capped in thickness rather than filling its row: the leftover is
 * air, and air is what stops a list of bars reading as a solid block.
 */
function Bars({ rows }: { rows: Bar[] }) {
  if (!rows.length) return <p className="hint">Nothing recorded yet.</p>
  const max = Math.max(...rows.map(r => r.n)) || 1
  return (
    <div className="bars">
      {rows.map(r => (
        <div className="brow" key={r.label}>
          <span className="bl" title={r.label}>{r.label}</span>
          <span className="bt">
            <i style={{ width: `${Math.max(1.5, (r.n / max) * 100)}%` }} />
          </span>
          <span className="bn">{r.n.toLocaleString('en-GB')} <small>{r.pct}%</small></span>
        </div>
      ))}
    </div>
  )
}

/**
 * PATIENTS PER EVENING: A COLUMN PER DAY, AND NOTHING ELSE ON THE CANVAS.
 *
 * A month is at most 31 columns, which is exactly the width a phone can hold
 * without a scroll, so this is drawn as columns and not as a line: a count on a
 * particular evening is a thing that happened, and a line between two evenings
 * draws a path through a night when the clinic was shut.
 *
 * What is deliberately absent: a trend line, a moving average, a projection, a
 * comparison with last month. Ten patients on Tuesday and fourteen on Wednesday
 * is weather. The page says so in its own words a few lines above this, and a
 * chart that quietly implied otherwise would be arguing with it.
 *
 * ONE number is printed, on the busiest column, because a label on all
 * thirty-one is noise and the reader can hover for the rest. The top rule is
 * the month's maximum: a single hairline, so the columns are measurable without
 * a grid drawn behind them.
 */
function Columns({ rows }: { rows: { day: number; n: number }[] }) {
  const max = Math.max(...rows.map(r => r.n)) || 1
  const peak = rows.reduce((a, b) => (b.n > a.n ? b : a), rows[0])
  const fmt = (d: number) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return (
    <div className="cols">
      <div className="cols-y">
        <span className="cols-max">{max}</span>
        <span className="cols-zero">0</span>
      </div>
      <div className="cols-plot">
        <div className="cols-rule" />
        <div className="cols-bars">
          {rows.map(e => (
            <div className="colw" key={e.day}
                 data-tip={`${fmt(e.day)} · ${e.n} ${e.n === 1 ? 'patient' : 'patients'}`}>
              {e.day === peak.day && e.n > 0 && <b className="colcap">{e.n}</b>}
              <i style={{ height: `${e.n ? Math.max(3, (e.n / max) * 100) : 0}%` }} />
            </div>
          ))}
        </div>
        <div className="cols-x">
          <span>{fmt(rows[0].day)}</span>
          <span>{fmt(rows[rows.length - 1].day)}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * The month's shape, at the size of a word, inside the tile whose number it
 * explains. It carries no axis and no labels on purpose: it is not a chart the
 * reader measures, it is the difference between "132" and "132, and the last
 * week was the quiet one". The real chart is below, with its numbers.
 */
function Spark({ rows }: { rows: { day: number; n: number }[] }) {
  if (rows.length < 3) return null
  const max = Math.max(...rows.map(r => r.n)) || 1
  const W = 100, H = 24
  const step = W / Math.max(1, rows.length - 1)
  const pts = rows.map((r, i) => `${(i * step).toFixed(1)},${(H - (r.n / max) * (H - 3) - 1.5).toFixed(1)}`)
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
      <polyline points={`0,${H} ${pts.join(' ')} ${W},${H}`} className="spark-fill" />
      <polyline points={pts.join(' ')} className="spark-line" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function CardView({ s, onClose }: { s: Stats; onClose: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const who = multiRoom() && role() === 'doctor' ? doctorById(currentDoctorId() ?? undefined) : undefined
  const d = cardData(s, who)
  useEffect(() => { if (ref.current) drawCard(ref.current, d) })
  return (
    <div className="cardwrap">
      <canvas ref={ref} width={CARD_W} height={CARD_H} className="cardpv" />
      <div className="row">
        <button className="btn" onClick={() => downloadCard(d)}>Save as a picture</button>
        <button className="btn ghost" onClick={() => { ensurePrintStyles(); printCard(d) }}>Print it</button>
        <button className="lnk" onClick={onClose}>close</button>
      </div>
      {d.topDiagnoses.length === 0 && (
        <p className="hint">
          No condition has been treated 25 times this month, so none is named on the card.
          Below that, a "case" in a town this size is a person.
        </p>
      )}
    </div>
  )
}
