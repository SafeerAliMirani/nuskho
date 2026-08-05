import { db } from './db'

/**
 * Erasing things, on purpose.
 *
 * Two separate acts, because they are nothing like each other:
 *
 *   clearRecords()  — throws away patients and prescriptions, keeps the clinic.
 *                     This is what you want after testing: the doctor, his paper
 *                     settings and his medicine list survive, the practice
 *                     rounds do not.
 *
 *   factoryReset()  — puts the machine back to the state it left us in. Only
 *                     for a device being handed to a different clinic.
 *
 * Both are irreversible and offline: there is no server holding a copy. So both
 * are admin-only, both make you type a word, and both offer a backup first.
 */

export type ResetReport = { patients: number; visits: number; drugs: number }

/** Patients and prescriptions go. The clinic — doctor, paper, medicines — stays. */
export async function clearRecords(): Promise<ResetReport> {
  const patients = await db.patients.count()
  const visits = await db.visits.count()
  // `snapshots` holds a full JSON dump of every patient and every visit. Clearing
  // the two tables and leaving that behind is not erasing records, it is moving
  // them somewhere nobody thinks to look.
  await db.transaction('rw', db.patients, db.visits, db.snapshots, async () => {
    await db.patients.clear()
    await db.visits.clear()
    await db.snapshots.clear()
  })
  return { patients, visits, drugs: 0 }
}

/** Everything. The next launch starts at the welcome screen. */
export async function factoryReset(): Promise<ResetReport> {
  const patients = await db.patients.count()
  const visits = await db.visits.count()
  const drugs = await db.drugs.count()
  // Everything means everything. This machine may be handed to a different
  // clinic, and a leftover snapshot or a saved set is that clinic reading the
  // previous one's patients.
  await db.transaction('rw', db.patients, db.visits, db.drugs, db.snapshots, db.sets, async () => {
    await db.patients.clear()
    await db.visits.clear()
    await db.drugs.clear()
    await db.snapshots.clear()
    await db.sets.clear()
  })
  // Everything under the app's prefix, by SWEEP rather than by list. The list
  // this used to be fell behind twice: the per-role PINs for compounder,
  // pharmacy and clinic admin were never added to it — and a leftover PIN does
  // not merely leak, it LOCKS OUT, because checkRolePin only opens when the
  // key is absent; the second clinic inherits the first one's PIN with no way
  // to clear it, on a machine that says it has been wiped. The building's
  // extra doctors and the per-room token marks would have been the third
  // omission. A sweep cannot fall behind.
  try {
    const doomed: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('nuskho.')) doomed.push(k)
    }
    for (const k of doomed) localStorage.removeItem(k)
  } catch { /* private mode */ }
  try {
    sessionStorage.removeItem('nuskho.role')
    sessionStorage.removeItem('nuskho.doctorId')
  } catch { /* ignore */ }
  return { patients, visits, drugs }
}
