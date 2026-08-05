import { useEffect, useState } from 'react'
import { daySummary } from '../db'
import { daysSinceExport, storageReport } from '../safety'
import { stamp } from '../version'
import { IcChart, IcShield, IcClock } from '../ui/art'
import type { Visit } from '../types'

/**
 * The clinic admin's desk: operations always, the clinical record never.
 *
 * Everything on this screen is something the building may know because the
 * building produced it — the money its own desk collected, the shape of the
 * day, the age of the last backup, the health of the machine. There is no
 * field here for a prescription, a diagnosis or a history, and the role that
 * reaches this screen holds no permission that could fetch one.
 *
 * Backups stay the doctor's act on purpose: an export is a complete copy of
 * every prescription in the building, so this desk watches the age and nags,
 * and never holds the copy itself.
 */
export default function AdminDesk({ visits }: { visits: Visit[] }) {
  const [sum, setSum] = useState<Awaited<ReturnType<typeof daySummary>> | null>(null)
  const [store, setStore] = useState<{ persisted: boolean; usedMb: number; quotaMb: number } | null>(null)
  const [drawer, setDrawer] = useState('')

  useEffect(() => { daySummary(visits).then(setSum) }, [visits])
  useEffect(() => { storageReport().then(setStore).catch(() => null) }, [])

  const exportAge = daysSinceExport()
  const counted = drawer === '' ? null : +drawer
  const diff = sum && counted !== null ? counted - sum.collected : null

  const openTokens = sum ? sum.waiting : 0

  return (
    <div className="pane">
      <h2><IcChart size={17} /> Today, as the desk counted it</h2>

      <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
        <div className="feebar" style={{ flexDirection: 'column', alignItems: 'flex-start', flex: 1, minWidth: 160 }}>
          <label>Taken at the desk</label>
          <b style={{ fontSize: 24 }}>Rs {sum?.collected ?? 0}</b>
        </div>
        <div className="feebar" style={{ flexDirection: 'column', alignItems: 'flex-start', flex: 1, minWidth: 160 }}>
          <label>Waiting to be given back</label>
          <b style={{ fontSize: 24, color: sum && sum.toRefund > 0 ? 'var(--bad)' : undefined }}>
            Rs {sum?.toRefund ?? 0}</b>
        </div>
        <div className="feebar" style={{ flexDirection: 'column', alignItems: 'flex-start', flex: 1, minWidth: 160 }}>
          <label>Still due, to collect kindly</label>
          <b style={{ fontSize: 24 }}>Rs {sum?.due ?? 0}</b>
        </div>
      </div>

      <p className="hint">
        {sum ? `${sum.total} tokens · ${sum.printed} printed · ${sum.seen} seen · ${sum.left} left · ${sum.waived} free on the doctor's word` : '…'}
      </p>

      <h2 style={{ marginTop: 18 }}>Closing the drawer</h2>
      <div className="row">
        <div className="fld" style={{ maxWidth: 220 }}>
          <label>Cash counted in the drawer</label>
          <input inputMode="numeric" value={drawer} placeholder="count, then type it"
                 onChange={e => setDrawer(e.target.value.replace(/[^0-9]/g, '').slice(0, 7))} />
        </div>
        {diff !== null && (
          <p className="hint" style={{ alignSelf: 'flex-end', color: diff === 0 ? 'var(--g)' : 'var(--warn)' }}>
            {diff === 0 ? 'Matches the system exactly.'
              : diff > 0 ? `Rs ${diff} over. Write down why.`
              : `Rs ${-diff} short. Write it down with a note; three shorts in a week is a conversation.`}
          </p>
        )}
      </div>

      <h2 style={{ marginTop: 18 }}><IcClock size={17} /> The day's close</h2>
      <p className="hint">
        {openTokens === 0
          ? 'Every token has ended as printed, seen, left, cancelled or referred. The day can close honestly.'
          : `${openTokens} token${openTokens > 1 ? 's' : ''} still open. Each must end as printed, seen, left, cancelled or referred before the evening's figures are true.`}
      </p>

      <h2 style={{ marginTop: 18 }}><IcShield size={17} /> The machine</h2>
      <div className="line">
        <div className="hd"><div>
          <b>{exportAge === null ? 'No backup has ever left this machine' : `Last backup left ${exportAge} day${exportAge === 1 ? '' : 's'} ago`}</b>
          <small>
            Nightly snapshots run inside, but only an exported file survives the disk.
            The export itself is the doctor's act: it is a complete copy of every
            prescription, so this desk only watches the age.
          </small>
        </div></div>
      </div>
      <div className="line">
        <div className="hd"><div>
          <b>{store ? (store.persisted ? 'Records protected from browser cleanup' : 'Storage NOT yet protected') : 'Checking storage…'}</b>
          <small>
            {store ? `${store.usedMb} MB used of ${store.quotaMb} MB. ` : ''}
            {store && !store.persisted
              ? 'Chrome may treat the practice as cache. Open the app once as the doctor and accept the storage prompt.'
              : 'Checked at every start.'}
          </small>
        </div></div>
      </div>

      <p className="hint" style={{ marginTop: 16 }}>
        This desk never sees a prescription, a diagnosis, a history or a medicine name,
        and it never ranks one doctor against another. {stamp()}
      </p>
    </div>
  )
}
