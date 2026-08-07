import { db, uid, nextToken, closeVisit } from './db'
import { doctorById, visitDoctorId, activeDoctors, isSitting, type Doctor } from './doctors'
import { currentDoctorId } from './roles'
import { signal } from './ui/bus'
import type { Visit, SentOn } from './types'

/**
 * ONE DOCTOR SENDING A PATIENT TO ANOTHER.
 *
 * Safeer asked for this and half-answered it himself:
 *
 *   "doctor 1 can see the prescription not the input system, and there can be
 *    a communication system, like if dr A recommend to Dr B so Doctor B can
 *    see the details typed by doctor A and patients prescription."
 *
 * That is exactly how it works in a hospital corridor, and it is worth being
 * precise about WHY, because the precision is what keeps this safe.
 *
 * A REFERRAL IS NOT A PERMISSION SETTING. It is an event with a patient in the
 * middle of it. Dr A does not gain standing access to Dr B's records, or the
 * reverse. What happens is that on Tuesday evening Dr A says "this chest pain
 * is not mine, go to Room 4", and from that moment — for that patient, for that
 * complaint — Dr B needs to know what Dr A found. Tomorrow, for a different
 * patient, he does not. So the door this file opens is narrow, per patient, and
 * opened by a doctor, never by a switch in a settings screen.
 *
 * WHAT THIS DELIBERATELY IS NOT: A MESSAGING SYSTEM.
 *
 * The obvious build is an inbox — Dr A writes to Dr B, Dr B has unread
 * messages. It is obvious and it is wrong for a clinic, for one reason: a
 * message can be missed, and a sender assumes it was read. Every real harm in
 * hospital software of this shape comes from that gap. Doctors in one building
 * do not message each other; they lean out of the door, or they phone, and the
 * PATIENT CARRIES THE PAPER. That last part is the actual protocol, everywhere,
 * and it is reliable because the patient is highly motivated to deliver it.
 *
 * So Nuskho does what the corridor does:
 *
 *   1. THE PAPER. The referral prints on the patient's own slip — where he is
 *      being sent, and why, in the doctor's words. That is the channel that
 *      cannot fail, and it works when he is sent to a hospital in Karachi where
 *      there is no Nuskho at all.
 *   2. THE TOKEN. If he is being sent to a room in this same building, a token
 *      appears in that room's queue with his name already on it, so nobody
 *      re-types anything at the desk and the compounder can see where to walk
 *      him. It is a queue entry, not a notification: it is on the screen the
 *      other room already looks at all evening.
 *   3. THE RECORD, READ ONLY. When Dr B opens that token he sees what Dr A
 *      wrote — the finding, the readings, the medicines, the reason for
 *      sending — and he cannot touch a character of it. He writes his own
 *      prescription, under his own name, on his own paper. That is Safeer's
 *      "see the prescription, not the input system", and it is also the law:
 *      the name on a prescription is the person answerable for it.
 *
 * STORED ONCE. The referral lives on the SENDING consultation. The receiving
 * token holds only `fromVisitId`, and reads the real thing. A copy would go
 * stale the moment Dr A corrected his diagnosis while the patient was still
 * walking down the corridor, and a stale copy of a clinical note is worse than
 * no note, because it looks current.
 */

/* --------------------------------------------------------------- where to */

/** The rooms a doctor may send to: this building's, sitting tonight, not him. */
export function sendTargets(me?: string | null): Doctor[] {
  const mine = me ?? currentDoctorId()
  return activeDoctors().filter(d => d.id !== mine && isSitting(d.id))
}

/** "Room 4 · Dr S. Soomro", or the place he typed, or nothing sensible. */
export function destinationEn(s: SentOn | undefined): string {
  if (!s) return ''
  const d = doctorById(s.toDoctorId)
  if (d) return `Room ${d.room} · ${d.nameEn}`
  return s.toPlace ?? ''
}

/** The same destination in Sindhi, and ONLY when there is a reviewed word for
 *  it. A doctor's Sindhi name is his own; a place the doctor typed is his own.
 *  Nothing here invents a Sindhi string for a slip. */
export function destinationSd(s: SentOn | undefined): string {
  if (!s) return ''
  const d = doctorById(s.toDoctorId)
  return d ? d.nameSd : ''
}

/* ------------------------------------------------------------- sending on */

export type SendOn = {
  toDoctorId?: string
  toPlace?: string
  note: string
  /** raise the receiving room's own fee as due at the counter */
  charge: boolean
}

export type SendResult =
  | { ok: true; token?: number; room?: string }
  | { ok: false; why: string }

/**
 * Send this patient on, and record it in one place.
 *
 * The order matters. The other room's token is raised FIRST, because that is
 * the part with a patient standing up and walking; if the write of `sentOn`
 * failed afterwards we would have a real token in a real queue and a missing
 * note, which is recoverable by asking the patient. The reverse — a note saying
 * he was sent to Room 4 and no token in Room 4 — sends him to a door nobody is
 * expecting him at.
 */
export async function sendOn(visitId: string, p: SendOn): Promise<SendResult> {
  const v = await db.visits.get(visitId)
  if (!v) return { ok: false, why: 'That token is gone.' }

  const note = p.note.trim().slice(0, 240)
  if (!note) return { ok: false, why: 'Say why you are sending him. It is the only thing the other doctor gets.' }

  const to = p.toDoctorId ? doctorById(p.toDoctorId) : undefined
  const place = (p.toPlace ?? '').trim().slice(0, 80)
  if (!to && !place) return { ok: false, why: 'Choose a room, or type where he is going.' }
  if (to && to.id === visitDoctorId(v.doctorId)) return { ok: false, why: 'That is this room.' }

  let toVisitId: string | undefined
  let token: number | undefined

  if (to) {
    token = await nextToken(to.id)
    toVisitId = uid()
    await db.visits.add({
      id: toVisitId, patientId: v.patientId, token, status: 'waiting',
      createdAt: Date.now(), lines: [], tests: [], advice: [],
      doctorId: to.id,
      fromVisitId: visitId,
      // The second room charges its own fee, or the doctor decides it does not.
      // Either way it is DUE, never paid: the money has not been taken, and a
      // fee the app records as collected is money the drawer will be short.
      fee: p.charge && to.fee > 0
        ? { amount: to.fee, state: 'due' as const, at: Date.now() }
        : { amount: 0, state: 'waived' as const, at: Date.now() },
      // He carries the urgency with him. A doctor does not send a patient down
      // the corridor mid-consultation for a mild thing.
      urgent: v.urgent || undefined,
    })
  }

  const sentOn: SentOn = {
    toDoctorId: to?.id, toPlace: to ? undefined : place,
    note, at: Date.now(), toVisitId,
  }
  await db.visits.update(visitId, { sentOn })

  // A consultation that produced no paper ENDS as referred. One that already
  // printed stays 'done': the prescription happened, and rewriting its ending
  // would take a printed slip out of the evening's count of printed slips.
  if (!v.printedAt && v.status === 'waiting') await closeVisit(visitId, 'referred')

  if (to && token) {
    const pt = await db.patients.get(v.patientId)
    // The same chime the desk hears for any new token. Deliberately NOT a new
    // kind of alert: nothing clinical travels on the bus, and a referral is a
    // patient arriving in a queue.
    signal({ kind: v.urgent ? 'urgent' : 'patient', token, name: pt?.name ?? '' })
  }

  return { ok: true, token, room: to?.room }
}

/** Undo, while the patient is still in the chair. Only before the other room
 *  has touched it — once Dr B has written a line, this is his consultation and
 *  Dr A does not reach into it. */
export async function unsend(visitId: string): Promise<SendResult> {
  const v = await db.visits.get(visitId)
  if (!v?.sentOn) return { ok: false, why: 'Nothing to undo.' }
  const other = v.sentOn.toVisitId ? await db.visits.get(v.sentOn.toVisitId) : undefined
  if (other && (other.lines.length > 0 || other.printedAt || other.status !== 'waiting'))
    return { ok: false, why: 'That room has already started. Ask them.' }
  if (other) await db.visits.delete(other.id)
  await db.visits.update(visitId, { sentOn: undefined })
  if (v.status === 'referred') await closeVisit(visitId, 'waiting')
  return { ok: true }
}

/* ------------------------------------------------------------- receiving */

export type Incoming = {
  from: Visit
  /** who sent him, for the card's heading */
  doctorEn: string
  doctorSd: string
  room: string
  note: string
  at: number
}

/**
 * What the receiving doctor is shown. Read straight from the sender's live
 * record, and returned as data rather than as anything editable.
 *
 * Returns null unless this token really was raised by a referral naming this
 * visit. There is no route from here to "show me another room's patient":
 * `fromVisitId` is written by sendOn and by nothing else.
 */
export async function incoming(v: Visit | null | undefined): Promise<Incoming | null> {
  if (!v?.fromVisitId) return null
  const from = await db.visits.get(v.fromVisitId)
  if (!from) return null
  // and the sender must actually claim to have sent him here: a fromVisitId
  // pointing at a consultation with no referral on it is not a referral
  if (!from.sentOn || from.sentOn.toVisitId !== v.id) return null
  const d = doctorById(visitDoctorId(from.doctorId))
  return {
    from,
    doctorEn: d?.nameEn ?? 'the other room',
    doctorSd: d?.nameSd ?? '',
    room: d?.room ?? '',
    note: from.sentOn.note,
    at: from.sentOn.at,
  }
}

/** For the queue row, without loading the sender's whole consultation: was
 *  this token walked over from another room, and from which? */
export function cameFrom(v: Visit, all: Visit[]): Doctor | undefined {
  if (!v.fromVisitId) return undefined
  const from = all.find(x => x.id === v.fromVisitId)
  return from ? doctorById(visitDoctorId(from.doctorId)) : undefined
}
