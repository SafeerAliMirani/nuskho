import {
  db, uid, nextToken, nextPatientNum, findByCode, patientCode, closeVisit, markRefunded,
  daySummary, todaysVisits, markTestsPaid,
} from './db'
import { checkRolePin, can, type Role } from './roles'
import { activeDoctors, isSitting, setSitting, multiRoom, doctorById, visitDoctorId } from './doctors'
import { course } from './course'
import { printToken } from './print/print'
import { paper } from './paper'
import { onSignal, signal, setRelay, deliverFromWire, type Signal } from './ui/bus'
import { storeKind, storeSeesTheDay, type Store } from './store'
import { chargesFor, chargeTotal } from './testfees'
import { staffRoles } from './staff'
import { INSTANT } from './data/vitals'
import type { FeeState, VisitStatus } from './types'

/**
 * THE BUILDING, ON ITS OWN WIFI.
 *
 * One machine in the clinic HOLDS THE RECORDS: the same browser database the
 * solo product has always used, chosen by a human in Setup, marked in its own
 * localStorage and nowhere else. Every other device — the receptionist's
 * phone, the compounder's two phones, the pharmacy counter's handsets — is a
 * MIRROR: a door and a screen, holding nothing. A mirror that is stolen,
 * dropped in a canal or sold tomorrow carries no records, because no record
 * was ever written to it.
 *
 * Between them sits the wifi hub (tools/wifi-hub.mjs), which is deliberately
 * a dumb relay: it stamps who said what and passes it on. It stores nothing
 * and understands nothing.
 *
 * HOW A MIRROR GETS ANYTHING DONE: it asks. Every action is an INTENT sent to
 * the record holder — "add this patient", "mark this line given" — and the
 * record holder applies it through the exact same functions the solo product
 * uses, then pushes fresh state back. One writer, one database, no merging,
 * no conflicts, no sync engine to trust. If the record holder's machine is
 * off, the mirrors say so honestly and the paper pad takes over, which is
 * exactly what happens today when the one laptop is off.
 *
 * WHAT CROSSES THE WIRE, AND WHAT NEVER DOES. The queue a mirror shows is
 * what the desk's paper register already shows the room: names, numbers,
 * money state. Medicine lines cross ONLY to a device signed in as pharmacy,
 * and only for printed slips — the same lines the patient is carrying past
 * that counter on paper. Diagnoses, histories and vitals details never leave
 * the record holder. And nothing here ever touches the internet: the socket
 * is same-origin on the building's own wire.
 *
 * The PINs stay where they live. A mirror's sign-in sends the typed PIN to
 * the record holder, which checks it against its own stored hash. No hash is
 * copied to phones, and no session survives on a phone beyond the sitting.
 */

/* ------------------------------------------------------------------ wire types */

export type WireFee = {
  amount: number; state: FeeState
  refund?: number; refundNote?: string; refundedAt?: number
}

export type WireVisit = {
  id: string; token: number; status: VisitStatus; urgent?: boolean
  name: string; code: string; createdAt: number
  doctorId?: string
  printedAt?: number; dispensedAt?: number
  fee?: WireFee
  hasVitals: boolean
  linesN: number
  /**
   * MONEY FOR A TEST DONE IN THE ROOM, AND WHY IT HAD TO CROSS THE WIRE.
   *
   * The compounder does the sugar, tells the doctor the number, and takes Rs
   * 100 to Rs 300 from the patient on his way out. That is his job and his
   * phone is where he does it, and until now the phone could neither record
   * the reading nor see the charge. The tour running ON that phone promised
   * both. Every evening worked from a phone, that money walked out of the door.
   *
   * DERIVED, never stored: the charge exists because a reading exists, so a
   * reading deleted at the machine stops being charged for here too. Sent only
   * to a role holding `tests`, which is the compounder and the doctor, and
   * never to the counter or the pharmacy.
   */
  tests?: { key: string; en: string; amount: number }[]
  testsPaid?: boolean
}

export type WireDoctor = {
  id: string; nameEn: string; nameSd: string; room: string; fee: number; sitting: boolean
}

export type WireState = {
  visits: WireVisit[]
  doctors: WireDoctor[]
  multi: boolean
  /** whether the medical store is the clinic's own or a shop renting space */
  store: Store
  sums: { total: number; printed: number; waiting: number; collected: number; toRefund: number; due: number }
}

export type WireRxLine = {
  brand: string; strength: string; n: number; unit: string; days: number; given?: number
}
export type WireRx = { visitId: string; lines: WireRxLine[] }[]

/** One prescription, sent back to a rented store that asked for it by number. */
export type WireSlip = {
  id: string; token: number; name: string; code: string
  printedAt?: number; dispensedAt?: number
  lines: WireRxLine[]
}

export type IntentKind =
  | 'addPatient' | 'openByCode' | 'closeVisit' | 'setVitals' | 'markRefunded'
  | 'setGiven' | 'giveAll' | 'reopen' | 'reprint' | 'setSitting' | 'openSlip'
  | 'markTestsPaid'

/** Which permission each intent needs, checked by the record holder against
 *  the ROLE the mirror signed in as. One list, same as roles.ts: nothing
 *  decides twice. */
const NEED: Record<IntentKind, Parameters<typeof can>[0]> = {
  addPatient: 'money', openByCode: 'money', closeVisit: 'queue', setVitals: 'queue',
  markRefunded: 'money', setGiven: 'dispense', giveAll: 'dispense', reopen: 'dispense',
  reprint: 'money', setSitting: 'queue', openSlip: 'dispense',
  // the person who did the test is the person who collects for it
  markTestsPaid: 'tests',
}

/** The roles a phone may hold. The doctor prescribes at the record holder's
 *  machine, and the Nuskho role changes identity — neither belongs on a
 *  mirror in this first building. */
export const MIRROR_ROLES: Role[] = ['counter', 'compounder', 'pharmacy', 'clinicadmin']

/* ------------------------------------------------- the bell, across machines
 *
 * A chime is not a record, but it still names a person and a number, and a
 * message bus is exactly the sort of convenience through which the rules about
 * who may know what get quietly broken. So the same question is asked of a
 * signal as of everything else that leaves this machine: may this role hear it?
 *
 * The refund one is the sharp case. "Give back Rs 200 to Ali, number 14" is
 * money, and the rented medical store downstairs has no business hearing it.
 */
const SAY_NEEDS: Record<Signal['kind'], 'queue' | 'money' | 'dispense'> = {
  bell: 'queue',       // the doctor calling the desk in
  coming: 'queue',     // the desk answering him
  patient: 'queue',
  urgent: 'queue',
  seen: 'queue',
  refund: 'money',
  printed: 'dispense', // and the queue too, see below
}

/** Who this signal is allowed to reach. */
function saySeenBy(kind: Signal['kind'], role: Role): boolean {
  if (kind === 'printed') {
    // a slip is ready: the room and the desk want to know, and so does a
    // pharmacy that is part of this clinic. A rented store does not get the
    // day's roll one chime at a time, for the same reason it is not pushed
    // the day's medicine lines.
    return can('queue', role) || (can('dispense', role) && storeSeesTheDay())
  }
  return can(SAY_NEEDS[kind], role)
}

/**
 * What a PHONE may raise.
 *
 * Deliberately two things, and both of them are pure nudges with no record
 * behind them: the bell, and the answer to it. Everything else on that list
 * means something was written down, and a thing that was written down is
 * announced by the machine that wrote it. A phone that could raise "number 14
 * printed" could announce a slip that does not exist.
 */
const MIRROR_MAY_SAY: Signal['kind'][] = ['bell', 'coming']

/* -------------------------------------------------------------- mode detection */

const HOST_KEY = 'nuskho.hostHere'

let mode: 'off' | 'host' | 'mirror' = 'off'
let onWire_local = false

export const buildingMode = () => mode

/** True only on the machine actually running the wire. The offer to become
 *  the record holder appears there and nowhere else: a phone that took it
 *  would become a second record holder holding nothing. */
export const hubIsLocal = () => onWire_local

export function hostHere(): boolean {
  try { return localStorage.getItem(HOST_KEY) === '1' } catch { return false }
}

export function setHostHere(v: boolean): void {
  try { v ? localStorage.setItem(HOST_KEY, '1') : localStorage.removeItem(HOST_KEY) } catch { /* ignore */ }
}

/**
 * Called once before the app renders. The ONLY signal that this copy is
 * inside a building is the hub answering /hub.json on our own origin. The
 * clinic folder (file://) cannot answer, the public web copy answers with the
 * app's own HTML which fails to parse, so both stay exactly what they were.
 */
export async function initBuilding(): Promise<void> {
  if (!location.protocol.startsWith('http')) return
  try {
    const r = await fetch('/hub.json', { cache: 'no-store' })
    const j = await r.json()
    if (j?.hub !== true) return
    onWire_local = j.local === true
  } catch { return }
  mode = hostHere() ? 'host' : 'mirror'
  connect()
  if (mode === 'host') startHost()
  else startMirror()
}

/* ------------------------------------------------------------------ the socket */

type Msg = Record<string, unknown> & { t: string; from?: number; to?: number }

let ws: WebSocket | null = null
const listeners = new Set<(m: Msg) => void>()

export function onWire(h: (m: Msg) => void): () => void {
  listeners.add(h)
  return () => listeners.delete(h)
}

function send(m: Record<string, unknown>): void {
  if (ws?.readyState === 1) ws.send(JSON.stringify(m))
}

function connect(): void {
  const url = location.origin.replace(/^http/, 'ws') + '/bus'
  ws = new WebSocket(url)
  resumedThisSocket = false
  ws.onmessage = e => {
    let m: Msg
    try { m = JSON.parse(String(e.data)) } catch { return }
    for (const h of [...listeners]) h(m)
  }
  // The wifi hiccups, the phone locks, the hub restarts: the socket comes
  // back by itself and the sitting resumes. Nobody re-pairs anything.
  const again = () => setTimeout(connect, 1500 + Math.random() * 1500)
  ws.onclose = again
  ws.onerror = () => { try { ws?.close() } catch { /* onclose reconnects */ } }
}

/* ---------------------------------------------------------------- the mirror */

export type AuthResult = { ok: true; role: Role } | { ok: false; why: string }

let hostId = 0
let hostSeen = 0
/**
 * WHICH JOBS THIS BUILDING HAS, HEARD BEFORE ANYBODY SIGNS IN.
 *
 * The mirror's front door only offers the jobs the building employs, and it was
 * reading that list from the PHONE's own storage, where a phone that has never
 * been used has nothing. The default is the doctor alone, and a doctor cannot
 * sign in on a phone, so a brand new phone joined the wifi and was offered NO
 * DOOR AT ALL. The first thing a clinic would ever do with a phone was the one
 * thing that could not work.
 *
 * The list rides on the host's own heartbeat, which every mirror already hears
 * without signing in. It is a list of job types in a building, so it is neither
 * clinical nor personal, and anybody standing in the corridor can see the same
 * thing by looking at the desks.
 */
let hostStaff: Role[] | null = null
let sid = ''
let lastAuth: { role: Role; pin: string } | null = null
let reqN = 0
let resumedThisSocket = false
const pending = new Map<number, (m: Msg) => void>()

let stateCb: ((s: WireState) => void) | null = null
let rxCb: ((r: WireRx) => void) | null = null
let upCb: ((up: boolean) => void) | null = null
let errCb: ((why: string) => void) | null = null
let expiredCb: (() => void) | null = null

export const hostUp = () => Date.now() - hostSeen < 10000

/** The doors this building actually has. Null until the host has been heard,
 *  which is honest: a door offered before the building answers is a guess. */
export const buildingRoles = (): Role[] | null => hostStaff

export function mirrorSubscribe(cb: {
  state: (s: WireState) => void
  rx?: (r: WireRx) => void
  up?: (up: boolean) => void
  /** an intent the host refused or lost — the screen says so, never swallows it */
  err?: (why: string) => void
  /** the host restarted and forgot this sitting: back to the door, visibly */
  expired?: () => void
}): void {
  stateCb = cb.state
  rxCb = cb.rx ?? null
  upCb = cb.up ?? null
  errCb = cb.err ?? null
  expiredCb = cb.expired ?? null
}

function startMirror(): void {
  try { sid = sessionStorage.getItem('nuskho.mirrorSid') ?? '' } catch { sid = '' }
  // The counter taps Coming on his phone and the doctor's bell stops glowing in
  // the room. The host decides whether a phone is allowed to say a given thing,
  // so this end sends and does not judge.
  setRelay(s => { if (sid && hostId) send({ t: 'say', to: hostId, sid, s }) })
  listeners.add(m => {
    /**
     * THE MIRROR PINS ITS HOST. The first machine heard claiming to be the
     * record holder is the record holder for this sitting, and every message
     * that only a host may send — state, medicine lines, replies — is dropped
     * unless it comes from that pinned sender. Without this, any device
     * inside the wifi could shout "I am the host" and the next sign-in would
     * hand it a PIN. The pin only moves when the real host has been silent
     * long enough to be honestly called off (a reboot), because a host that
     * is speaking cannot be impersonated, only raced — and this closes the
     * race for every phone that has ever heard the true one.
     */
    if (m.t === 'host') {
      if (hostId && m.from !== hostId && Date.now() - hostSeen < 15000) return
      const was = hostUp()
      if (hostId !== m.from) resumedThisSocket = false
      hostId = m.from ?? 0
      hostSeen = Date.now()
      if (Array.isArray(m.staff)) hostStaff = (m.staff as string[]).filter(
        r => (MIRROR_ROLES as string[]).includes(r)) as Role[]
      if (!was && upCb) upCb(true)
      // a fresh socket after a drop: pick the old sitting back up, once
      if (sid && !resumedThisSocket) { resumedThisSocket = true; send({ t: 'resume', to: hostId, sid }) }
      return
    }
    if (hostId && m.from !== hostId) return   // only the pinned host is heard
    if (m.t === 'state' && stateCb) stateCb(m.s as WireState)
    if (m.t === 'rx' && rxCb) rxCb(m.r as WireRx)
    // A chime from the clinic machine. It is already filtered by role there,
    // and it is dropped here unless it came from the pinned host, so a phone in
    // the waiting room cannot ring every other phone in the building.
    if (m.t === 'say' && m.s) deliverFromWire(m.s as Signal)
    if ((m.t === 'done' || m.t === 'authok' || m.t === 'authno') && typeof m.req === 'number') {
      pending.get(m.req)?.(m); pending.delete(m.req)
    }
  })
  setInterval(() => { if (upCb && !hostUp()) upCb(false) }, 3000)
}

function ask(m: Record<string, unknown>, timeoutMs = 8000): Promise<Msg> {
  const req = ++reqN
  return new Promise(res => {
    pending.set(req, res)
    send({ ...m, to: hostId, req })
    setTimeout(() => {
      if (pending.has(req)) {
        pending.delete(req)
        res({ t: 'done', ok: false, why: 'The clinic machine did not answer. Is it on?' })
      }
    }, timeoutMs)
  })
}

export async function mirrorAuth(role: Role, pin: string): Promise<AuthResult> {
  const r = await ask({ t: 'auth', role, pin })
  if (r.t === 'authok') {
    sid = String(r.sid)
    lastAuth = { role, pin }
    resumedThisSocket = true
    try { sessionStorage.setItem('nuskho.mirrorSid', sid) } catch { /* memory is enough */ }
    return { ok: true, role: r.role as Role }
  }
  return { ok: false, why: String(r.why ?? 'That is not right. Try again.') }
}

export function mirrorSignOut(): void {
  if (sid) send({ t: 'bye', to: hostId, sid })
  sid = ''; lastAuth = null
  try { sessionStorage.removeItem('nuskho.mirrorSid') } catch { /* ignore */ }
}

export async function intent(kind: IntentKind, p: Record<string, unknown>): Promise<Msg> {
  const r = await ask({ t: 'intent', kind, p, sid })
  // a host restart forgot the sitting: sign in again with what we know,
  // or — after a page reload lost the PIN from memory — go back to the door
  // VISIBLY instead of showing buttons that silently do nothing
  if (r.ok === false && r.code === 'expired') {
    if (lastAuth) {
      const again = await mirrorAuth(lastAuth.role, lastAuth.pin)
      if (again.ok) {
        const r2 = await ask({ t: 'intent', kind, p, sid })
        if (r2.ok === false && errCb) errCb(String(r2.why ?? 'That did not go through.'))
        return r2
      }
    }
    mirrorSignOut()
    if (expiredCb) expiredCb()
    return r
  }
  if (r.ok === false && errCb) errCb(String(r.why ?? 'That did not go through.'))
  return r
}

/* ------------------------------------------------------------------- the host */

type Sitting = { role: Role; fromId: number; at: number }

const sittings = new Map<string, Sitting>()   // sid -> who

function newSid(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map(b => b.toString(16).padStart(2, '0')).join('')
}

async function buildState(): Promise<WireState> {
  const visits = await todaysVisits()
  const pts = await db.patients.bulkGet(visits.map(v => v.patientId))
  const sums = await daySummary(visits)
  return {
    visits: visits.map((v, i) => ({
      id: v.id, token: v.token, status: v.status, urgent: v.urgent,
      name: pts[i]?.name ?? '—', code: pts[i] ? patientCode(pts[i]!.num) : '',
      createdAt: v.createdAt, doctorId: v.doctorId,
      printedAt: v.printedAt, dispensedAt: v.dispensedAt,
      fee: v.fee ? {
        amount: v.fee.amount, state: v.fee.state, refund: v.fee.refund,
        refundNote: v.fee.refundNote, refundedAt: v.fee.refundedAt,
      } : undefined,
      hasVitals: !!v.vitals && Object.keys(v.vitals).length > 0,
      linesN: v.lines.length,
      tests: chargesFor(v.vitals, INSTANT).map(c => ({ key: c.key, en: c.en, amount: c.amount })),
      testsPaid: !!v.testsPaidAt,
    })),
    doctors: activeDoctors().map(d => ({
      id: d.id, nameEn: d.nameEn, nameSd: d.nameSd, room: d.room, fee: d.fee,
      sitting: isSitting(d.id),
    })),
    multi: multiRoom(),
    store: storeKind(),
    sums: {
      total: sums.total, printed: sums.printed, waiting: sums.waiting,
      collected: sums.collected, toRefund: sums.toRefund, due: sums.due,
    },
  }
}

/** Medicine lines, PRINTED slips only, exactly what the paper says. */
async function buildRx(): Promise<WireRx> {
  const visits = (await todaysVisits()).filter(v => v.printedAt && v.lines.length > 0)
  return visits.map(v => ({
    visitId: v.id,
    lines: v.lines.map(l => {
      const c = course(l)
      return {
        brand: l.snap?.brand ?? '?', strength: l.snap?.strength ?? '',
        n: c.n, unit: c.unit, days: l.days, given: l.given,
      }
    }),
  }))
}

/**
 * Each role receives ITS OWN cut of the day, decided here, once, before the
 * wire — the mirror never gets to choose what it holds. The pharmacy screen
 * needs no fees and no vitals flag, so its phones never receive them; the
 * counter and the clinic admin have no business with a medicine count or a
 * vitals flag, so theirs are stripped; the doctor's private refund note goes
 * only to the money roles that will read it out at the counter. The rule for
 * every field is the one from the paper world: it crosses only to a desk that
 * would already have it on paper.
 */
function shapeFor(role: Role, s: WireState): WireState {
  const money = can('money', role)
  const history = can('history', role)
  const dispense = can('dispense', role)
  /**
   * A SHOP RENTING SPACE IS NEVER SENT THE DAY. See store.ts.
   *
   * Not hidden on its screen: never sent to its phone. A rented store's device
   * asks for one slip by the number on the paper in front of it and receives
   * exactly that. The list of who attended this clinic tonight, which is the
   * thing actually worth protecting, does not leave this machine.
   *
   * Only a dispense-ONLY role is cut off. A compounder or a counter clerk who
   * also hands medicines out still holds `queue`, and the queue is his job.
   */
  const shopOnly = dispense && !can('queue', role)
  const cut = shopOnly && !storeSeesTheDay()
  return {
    ...s,
    visits: cut ? [] : s.visits.map(v => ({
      ...v,
      fee: dispense && !money ? undefined
        : v.fee ? { ...v.fee, refundNote: money ? v.fee.refundNote : undefined } : undefined,
      hasVitals: history ? v.hasVitals : false,
      linesN: history || dispense ? v.linesN : 0,
      // a reading is clinical and a charge for it is this role's job or not
      tests: can('tests', role) ? v.tests : undefined,
      testsPaid: can('tests', role) ? v.testsPaid : undefined,
    })),
    // The evening's cash went to every phone on the wire, pharmacy included.
    // It is the money role's number and nobody else's.
    sums: money ? s.sums : { total: 0, printed: 0, waiting: 0, collected: 0, toRefund: 0, due: 0 },
  }
}

let pushQueued = false
async function pushState(): Promise<void> {
  if (pushQueued) return
  pushQueued = true
  setTimeout(async () => {
    pushQueued = false
    if (!sittings.size) return
    const s = await buildState()
    // A rented store is never pushed the day's medicine lines at all; it asks
    // for one slip at a time (intent 'openSlip'). A clinic's own counter, and
    // any role that already holds the queue, is pushed them as before.
    const rxHolders = [...sittings.values()].filter(x =>
      can('dispense', x.role) && (storeSeesTheDay() || can('queue', x.role)))
    const rx = rxHolders.length ? await buildRx() : null
    for (const [, sit] of sittings) {
      if (sit.fromId < 0) continue   // waiting to resume after a hub restart
      send({ t: 'state', to: sit.fromId, s: shapeFor(sit.role, s) })
      const mayHoldTheDay = storeSeesTheDay() || can('queue', sit.role)
      if (rx && can('dispense', sit.role) && mayHoldTheDay) send({ t: 'rx', to: sit.fromId, r: rx })
    }
  }, 120)
}

/** A wire string is untrusted: cut to size, or a 1 MB "name" ends up in the
 *  database, in every push, and on a thermal receipt. */
const clip = (v: unknown, n: number): string => String(v ?? '').slice(0, n).trim()

/** The one place a mirror's asked-for change becomes a record: the same
 *  functions the solo product calls, on the one database that exists. */
async function applyIntent(kind: IntentKind, p: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (kind === 'addPatient' || kind === 'openByCode') {
    let patientId: string
    if (kind === 'openByCode') {
      const found = await findByCode(clip(p.code, 13))
      if (!found) return { ok: false, why: 'No patient with that number. Add as new.' }
      patientId = found.id
    } else {
      const name = clip(p.name, 80)
      if (!name) return { ok: false, why: 'A name is needed.' }
      patientId = uid()
      await db.patients.add({
        id: patientId, num: await nextPatientNum(), name,
        phone: clip(p.phone, 15).replace(/[^0-9+ ]/g, '') || undefined,
        age: clip(p.age, 3).replace(/\D/g, '') || undefined,
        city: clip(p.city, 40) || undefined,
        createdAt: Date.now(),
      })
    }
    // a doctor this building does not have cannot be issued a token for
    const wantDoc = p.doctorId ? String(p.doctorId) : undefined
    const doctorId = wantDoc && activeDoctors().some(d => d.id === wantDoc) ? wantDoc : undefined
    if (wantDoc && !doctorId) return { ok: false, why: 'That room is not in this building.' }
    const token = await nextToken(doctorId)
    const amount = Math.min(100000, Math.max(0, Math.round(+(p.amount ?? 0) || 0)))
    const state = (['paid', 'due', 'waived'].includes(String(p.feeState)) ? p.feeState : 'paid') as FeeState
    const fee = { amount: state === 'waived' ? 0 : amount, state: (amount === 0 ? 'waived' : state) as FeeState, at: Date.now() }
    const vid = uid()
    await db.visits.add({
      id: vid, patientId, token, status: 'waiting', createdAt: Date.now(),
      lines: [], tests: [], advice: [], fee, urgent: p.urgent === true || undefined, doctorId,
    })
    const pt = await db.patients.get(patientId)
    const d = doctorById(doctorId)
    const slip = pt ? {
      token, patientName: pt.name, patientCode: patientCode(pt.num),
      fee: fee.amount, feeState: (fee.state === 'due' ? 'due' : fee.state === 'waived' ? 'waived' : 'paid') as 'paid' | 'waived' | 'due',
      at: fee.at,
      doctorEn: d?.nameEn, doctorSd: d?.nameSd, degreesEn: d?.degreesEn, room: d?.room,
    } : null
    if (pt) {
      signal(p.urgent === true
        ? { kind: 'urgent', token, name: pt.name }
        : { kind: 'patient', token, name: pt.name })
    }
    // The receipt comes out wherever there is a roll of paper: this machine's
    // thermal if the phone asked for that, or back on the asking device if it
    // is a desk PC with its own printer. Never both.
    if (slip && p.wantHostPrint === true && paper().token) printToken(slip)
    return { ok: true, token, slip }
  }

  const vid = String(p.visitId ?? '')
  const v = vid ? await db.visits.get(vid) : undefined

  if (kind === 'reprint') {
    if (!v) return { ok: false, why: 'That token is gone.' }
    const pt = await db.patients.get(v.patientId)
    if (!pt) return { ok: false, why: 'That token is gone.' }
    const d = doctorById(visitDoctorId(v.doctorId))
    const slip = {
      token: v.token, patientName: pt.name, patientCode: patientCode(pt.num),
      fee: v.fee?.amount ?? 0,
      feeState: (v.fee?.state === 'due' ? 'due' : v.fee?.state === 'waived' ? 'waived' : 'paid') as 'paid' | 'waived' | 'due',
      at: v.fee?.at ?? v.createdAt,
      doctorEn: d?.nameEn, doctorSd: d?.nameSd, degreesEn: d?.degreesEn, room: d?.room,
    }
    if (p.wantHostPrint === true && paper().token) printToken(slip)
    return { ok: true, slip }
  }
  /**
   * ONE SLIP, BY THE NUMBER ON THE PAPER.
   *
   * How a rented medical store works: the patient puts his prescription on the
   * counter, the shop scans the square or types the number, and gets back that
   * prescription's lines and nothing else. There is no way to ask for the next
   * one, the previous one, or a person.
   */
  if (kind === 'openSlip') {
    const pt = await findByCode(clip(p.code, 13))
    if (!pt) return { ok: false, why: 'That number is not on any slip from today.' }
    const today = await todaysVisits()
    const mine = today
      .filter(x => x.patientId === pt.id && x.printedAt && x.lines.length > 0)
      .sort((a, b) => (b.printedAt ?? 0) - (a.printedAt ?? 0))
    if (!mine.length) return { ok: false, why: 'Nothing was printed for that number today.' }
    const slip = mine[0]
    return {
      ok: true,
      slip: {
        id: slip.id, token: slip.token, name: pt.name, code: patientCode(pt.num),
        printedAt: slip.printedAt, dispensedAt: slip.dispensedAt,
        lines: slip.lines.map(l => {
          const c = course(l)
          return {
            brand: l.snap?.brand ?? '?', strength: l.snap?.strength ?? '',
            n: c.n, unit: c.unit, days: l.days, given: l.given,
          }
        }),
      },
    }
  }
  if (kind === 'closeVisit') {
    if (!v || v.printedAt) return { ok: false, why: 'That one cannot be closed.' }
    const s = String(p.status)
    if (!['seen', 'left', 'cancelled', 'referred'].includes(s)) return { ok: false, why: 'Not an ending.' }
    await closeVisit(vid, s as VisitStatus)
    return { ok: true }
  }
  if (kind === 'setVitals') {
    if (!v) return { ok: false, why: 'That token is gone.' }
    // MERGED, never replaced: two phones each typing one number must end with
    // both numbers on the record, not with the later phone erasing the first.
    // Values are strings, short, and at most a handful — anything else off
    // the wire would crash the slip renderer and make PRINT fail for ever.
    const raw = (p.vitals && typeof p.vitals === 'object' && !Array.isArray(p.vitals))
      ? p.vitals as Record<string, unknown> : {}
    const merged: Record<string, string> = { ...(v.vitals ?? {}) }
    let n = 0
    for (const [k, val] of Object.entries(raw)) {
      if (++n > 12) break
      const key = String(k).slice(0, 16)
      const s = typeof val === 'string' ? val.slice(0, 24).trim() : ''
      if (s) merged[key] = s
      else delete merged[key]
    }
    await db.visits.update(vid, { vitals: merged })
    return { ok: true }
  }
  if (kind === 'markTestsPaid') {
    if (!v) return { ok: false, why: 'That token is gone.' }
    const owed = chargeTotal(chargesFor(v.vitals, INSTANT))
    if (owed <= 0) return { ok: false, why: 'Nothing is owed for a test on this one.' }
    if (v.testsPaidAt) return { ok: false, why: 'That was already taken.' }
    await markTestsPaid(vid)
    return { ok: true }
  }
  if (kind === 'markRefunded') {
    if (!v) return { ok: false, why: 'That token is gone.' }
    // no chime: the 'refund' signal announces money OWED, and this is the
    // moment it stopped being owed
    await markRefunded(vid)
    return { ok: true }
  }
  if (kind === 'setGiven' || kind === 'giveAll' || kind === 'reopen') {
    if (!v || !v.printedAt) return { ok: false, why: 'Only a printed slip can be given.' }
    if (kind === 'reopen') {
      await db.visits.update(vid, { dispensedAt: undefined })
      return { ok: true }
    }
    if (kind === 'giveAll') {
      const lines = v.lines.map(l => l.given !== undefined ? l : { ...l, given: course(l).n })
      await db.visits.update(vid, { lines, dispensedAt: Date.now() })
      return { ok: true }
    }
    const i = +(p.index ?? -1)
    if (!(i >= 0 && i < v.lines.length)) return { ok: false, why: 'No such line.' }
    const given = p.given === null || p.given === undefined ? undefined
      : Math.max(0, Math.min(course(v.lines[i]).n || 9999, +(p.given as number) || 0))
    const lines: typeof v.lines = v.lines.map((l, k) => {
      if (k !== i) return l
      const { given: _g, ...rest } = l
      return given === undefined ? rest : { ...rest, given }
    })
    const all = lines.every(l => l.given !== undefined)
    await db.visits.update(vid, { lines, dispensedAt: all ? (v.dispensedAt ?? Date.now()) : undefined })
    return { ok: true }
  }
  if (kind === 'setSitting') {
    setSitting(String(p.doctorId ?? ''), p.sitting === true)
    return { ok: true }
  }
  return { ok: false, why: 'Unknown ask.' }
}

/**
 * Intents apply ONE AT A TIME, in arrival order, like print jobs. Two
 * pharmacy phones ticking two lines of the same slip within milliseconds are
 * two read-modify-writes on one row; unserialised, the later write erased the
 * earlier tick. A queue of two is invisible; a lost tick at a busy counter
 * is a patient short a medicine.
 */
let intentChain: Promise<unknown> = Promise.resolve()
function queuedIntent(job: () => Promise<Record<string, unknown>>): Promise<Record<string, unknown>> {
  const next = intentChain.then(job, job)
  intentChain = next.catch(() => {})
  return next
}

function startHost(): void {
  listeners.add(async m => {
    if (mode !== 'host') return

    // OUR socket reconnected: the hub restarted or the wifi blinked, and
    // every id it ever assigned is void. Sittings survive — the PINs were
    // typed and the day is live — but nothing is pushed anywhere until each
    // phone proves itself again with its sid.
    if (m.t === 'you') {
      for (const sit of sittings.values()) sit.fromId = -1
      return
    }

    if (m.t === 'auth') {
      const role = m.role as Role
      if (!MIRROR_ROLES.includes(role)) {
        send({ t: 'authno', to: m.from, req: m.req, why: 'That role signs in at the clinic machine itself.' })
        return
      }
      const ok = await checkRolePin(role, String(m.pin ?? ''))
      if (!ok) { send({ t: 'authno', to: m.from, req: m.req, why: 'That is not right. Try again.' }); return }
      const sid2 = newSid()
      sittings.set(sid2, { role, fromId: m.from!, at: Date.now() })
      send({ t: 'authok', to: m.from, req: m.req, sid: sid2, role })
      pushState()
      return
    }
    if (m.t === 'resume') {
      const sit = sittings.get(String(m.sid ?? ''))
      if (sit && m.from) { sit.fromId = m.from; sit.at = Date.now(); pushState() }
      return
    }
    if (m.t === 'bye') {
      sittings.delete(String(m.sid ?? ''))
      return
    }
    if (m.t === 'say') {
      const sit = sittings.get(String(m.sid ?? ''))
      if (!sit || sit.fromId !== m.from) return
      const said = m.s as Signal
      // a phone may nudge; it may not announce something that was written down
      if (!said || !MIRROR_MAY_SAY.includes(said.kind)) return
      if (!saySeenBy(said.kind, sit.role)) return
      // this machine hears it (the doctor's bell button stops glowing), and so
      // does every other phone entitled to it, but not the one that sent it
      deliverFromWire(said)
      tellTheBuilding(said, m.from)
      return
    }
    if (m.t === 'gone') {
      // the phone's socket dropped — wifi blink, screen lock. The sitting
      // waits for its sid to resume rather than dying: signing in again for
      // every walk past the corridor's dead spot would get the PINs taped to
      // the wall. A sitting nobody resumes is swept after twelve hours.
      for (const sit of sittings.values()) if (sit.fromId === m.from) sit.fromId = -1
      return
    }
    if (m.t === 'intent') {
      const sit = sittings.get(String(m.sid ?? ''))
      if (!sit || sit.fromId !== m.from) {
        send({ t: 'done', to: m.from, req: m.req, ok: false, code: 'expired', why: 'Your sitting expired. Sign in again.' })
        return
      }
      sit.at = Date.now()
      const kind = m.kind as IntentKind
      if (!NEED[kind] || !can(NEED[kind], sit.role)) {
        send({ t: 'done', to: m.from, req: m.req, ok: false, why: 'That role may not do this.' })
        return
      }
      let out: Record<string, unknown>
      try { out = await queuedIntent(() => applyIntent(kind, (m.p ?? {}) as Record<string, unknown>)) }
      catch { out = { ok: false, why: 'That did not go through. Try again.' } }
      send({ t: 'done', to: m.from, req: m.req, ...out })
      pushState()
      // the host's own screens re-read too: a token from a phone must appear
      // on the room's queue exactly like one typed at this keyboard
      window.dispatchEvent(new CustomEvent('nuskho:refresh'))
      return
    }
  })

  // I am here, every few seconds. Mirrors that cannot hear this say
  // "the clinic machine is off" instead of pretending. The same tick sweeps
  // sittings nobody has resumed since yesterday.
  setInterval(() => {
    // the heartbeat carries the building's job list so a phone that has never
    // been used can still be offered the right doors
    send({ t: 'host', staff: staffRoles().filter(r => MIRROR_ROLES.includes(r)) })
    const old = Date.now() - 12 * 3600 * 1000
    for (const [k, sit] of sittings) if (sit.at < old) sittings.delete(k)
  }, 4000)

  // The doctor prints, the desk refunds, a patient is closed at this
  // keyboard: every local change a mirror could care about already raises a
  // signal, so the push rides on it.
  onSignal(() => pushState())
  setInterval(() => pushState(), 7000)

  // And the signal itself goes out to the phones. This is installed on
  // `signal()` rather than on `onSignal`, which matters: only a signal raised
  // ON THIS MACHINE goes out. One that arrived from a phone has already been
  // given to everyone entitled to it, and re-broadcasting it would be a room
  // full of devices ringing each other for ever.
  setRelay(s => tellTheBuilding(s))
}

/**
 * Send a signal to every sitting allowed to hear it.
 *
 * `except` is the socket it came from, when a phone raised it: the counter who
 * pressed Coming does not need his own phone to chime at him.
 */
function tellTheBuilding(s: Signal, except?: number): void {
  for (const [, sit] of sittings) {
    if (sit.fromId < 0 || sit.fromId === except) continue
    if (!saySeenBy(s.kind, sit.role)) continue
    send({ t: 'say', to: sit.fromId, s })
  }
}

/**
 * How many phones could hear a bell right now.
 *
 * The doctor's bell says out loud whether anyone can hear it, because a bell
 * that rings in an empty room is worse than no bell. Before the wire carried
 * signals this counted only the other WINDOWS of this browser, so a clinic
 * whose compounder was on a phone was told nobody was listening while the
 * compounder sat there with the app open.
 */
export function earsOnTheWire(): number {
  if (mode !== 'host') return 0
  let n = 0
  for (const [, sit] of sittings) {
    if (sit.fromId >= 0 && saySeenBy('bell', sit.role)) n++
  }
  return n
}

/** How many devices are on the wire right now, for the Setup tab. */
export function sittingsList(): { role: Role }[] {
  return [...sittings.values()].map(s => ({ role: s.role }))
}
