/**
 * THE SUPER ADMIN PANEL. SAFEER'S PRIVATE TOOL, AND IT IS NEVER DEPLOYED.
 *
 * How "never deployed" is actually enforced, not just intended: vite builds
 * exactly one entry (index.html), so dev-sa.html and this file exist only
 * under `npx vite` on a machine that has the repo. There is no route, no
 * link, no build output. The standing rule is that super admin appears on no
 * public page, and the strongest form of that is: there is no page.
 *
 * What it does:
 *   - reads the clinic list from the worker's /sa route with the bearer
 *     secret (wrangler secret put SA_KEY), which lives in HIS browser's
 *     localStorage and in Cloudflare and nowhere else, never in the repo
 *   - writes the contract facts he types: name, paid until, amount, contact,
 *     invoices, notes
 *   - shows each clinic's last heartbeat (version and when), which is the
 *     receiver's whole vocabulary
 *   - generates unlock codes OFFLINE with the same makeCode the app itself
 *     uses, imported from src/service.ts, so the algorithm exists once and
 *     can never drift between the phone call's two ends
 */
import { makeCode } from '../service'

const $ = (id: string) => document.getElementById(id) as HTMLElement
const val = (id: string) => ($(id) as HTMLInputElement).value

type Contract = {
  token?: string
  name?: string; paidUntil?: string; amount?: number; contact?: string
  notes?: string; invoices?: { day: string; amount: number; note: string }[]
}

/** 32 hex chars, 128 bits: the private link's whole security. */
const mintToken = (): string =>
  [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('')
type Row = { contract?: Contract; hb?: { v: string; at: number } }

let data: Record<string, Row> = {}
/** The open clinic's link token. Saved with the record; rotated on demand. */
let curToken = ''

function showLink() {
  const el = $('f-link')
  if (!curToken) { el.innerHTML = '<small>no link yet: it is minted when you save</small>'; return }
  const link = cfg.url.replace(/\/$/, '') + '/c/' + curToken
  el.innerHTML = `<small>private link, WhatsApp it to the clinic:</small><br>
    <code style="user-select:all">${link}</code>`
}

const cfg = {
  get url() { return localStorage.getItem('sa.url') ?? 'https://nuskho.safeer-ali-mirani.workers.dev' },
  set url(u: string) { localStorage.setItem('sa.url', u) },
  get key() { return localStorage.getItem('sa.key') ?? '' },
  set key(k: string) { localStorage.setItem('sa.key', k) },
}

const ago = (t: number): string => {
  const m = Math.round((Date.now() - t) / 60000)
  if (m < 60) return m + ' min ago'
  const h = Math.round(m / 60)
  if (h < 48) return h + ' hours ago'
  return Math.round(h / 24) + ' days ago'
}

async function api(method: 'GET' | 'POST', body?: unknown): Promise<Response> {
  return fetch(cfg.url.replace(/\/$/, '') + '/sa', {
    method,
    headers: {
      Authorization: 'Bearer ' + cfg.key,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

function say(m: string, bad = false) {
  const el = $('msg')
  el.textContent = m
  el.style.color = bad ? '#b3362a' : '#0f5c4a'
}

async function load() {
  say('loading…')
  try {
    const r = await api('GET')
    if (!r.ok) { say(`the worker said ${r.status}: ${await r.text()}`, true); return }
    data = await r.json()
    render()
    say(Object.keys(data).length + ' clinics')
  } catch (e) {
    say('could not reach the worker: ' + String(e), true)
  }
}

function render() {
  const codes = Object.keys(data).sort()
  const rows = codes.map(code => {
    const c = data[code].contract ?? {}
    const hb = data[code].hb
    const overdue = c.paidUntil && c.paidUntil < new Date().toISOString().slice(0, 10)
    return `<tr data-code="${code}">
      <td><b>${code}</b></td>
      <td>${c.name ?? ''}</td>
      <td style="${overdue ? 'color:#b3362a;font-weight:700' : ''}">${c.paidUntil ?? ''}</td>
      <td>${c.amount ? 'Rs ' + c.amount : ''}</td>
      <td>${hb ? `${hb.v}<br><small>${ago(hb.at)}</small>` : '<small>never heard</small>'}</td>
      <td>${c.contact ?? ''}</td>
      <td><button class="edit" data-code="${code}">open</button></td>
    </tr>`
  }).join('')
  $('list').innerHTML = `<table>
    <tr><th>Code</th><th>Clinic</th><th>Paid until</th><th>Monthly</th><th>Last heartbeat</th><th>Contact</th><th></th></tr>
    ${rows || '<tr><td colspan="7"><small>nothing yet: add a clinic below, or wait for a heartbeat</small></td></tr>'}
  </table>`
  document.querySelectorAll<HTMLButtonElement>('.edit').forEach(b =>
    b.addEventListener('click', () => openClinic(b.dataset.code!)))
}

function openClinic(code: string) {
  const c = data[code]?.contract ?? {}
  curToken = c.token ?? ''
  showLink()
  ;($('f-code') as HTMLInputElement).value = code
  ;($('f-name') as HTMLInputElement).value = c.name ?? ''
  ;($('f-paid') as HTMLInputElement).value = c.paidUntil ?? ''
  ;($('f-amount') as HTMLInputElement).value = c.amount ? String(c.amount) : ''
  ;($('f-contact') as HTMLInputElement).value = c.contact ?? ''
  ;($('f-notes') as HTMLTextAreaElement).value = c.notes ?? ''
  ;($('f-invoices') as HTMLTextAreaElement).value =
    (c.invoices ?? []).map(i => `${i.day} ${i.amount} ${i.note}`).join('\n')
  $('editor').style.display = 'block'
  ;($('g-clinic') as HTMLInputElement).value = code
  window.scrollTo({ top: $('editor').offsetTop - 20, behavior: 'smooth' })
}

async function saveClinic() {
  const invoices = ($('f-invoices') as HTMLTextAreaElement).value.split('\n')
    .map(l => l.trim()).filter(Boolean).map(l => {
      const m = l.match(/^(\S+)\s+(\d+)\s*(.*)$/)
      return m ? { day: m[1], amount: +m[2], note: m[3] } : { day: '', amount: 0, note: l }
    })
  // a clinic gets its link on first save; rotation replaces it explicitly
  if (!curToken) curToken = mintToken()
  const body = {
    code: val('f-code'), token: curToken, name: val('f-name'), paidUntil: val('f-paid'),
    amount: +val('f-amount') || 0, contact: val('f-contact'),
    notes: ($('f-notes') as HTMLTextAreaElement).value, invoices,
  }
  const r = await api('POST', body)
  say(r.ok ? 'saved' : 'save refused: ' + await r.text(), !r.ok)
  if (r.ok) { showLink(); load() }
}

function rotateLink() {
  // the old link dies at the next save, which is the whole point: a link
  // forwarded to the wrong group chat is one Save away from worthless
  curToken = mintToken()
  showLink()
  say('new link minted. Press "Save the record" to make it live and kill the old one.')
}

async function removeClinic() {
  const code = val('f-code')
  if (!code) return
  const sure = ($('f-sure') as HTMLInputElement)
  if (!sure.checked) { say('tick "I mean it" first: delete has no undo', true); return }
  const r = await api('POST', { code, delete: true })
  say(r.ok ? 'deleted' : 'delete refused', !r.ok)
  sure.checked = false
  $('editor').style.display = 'none'
  if (r.ok) load()
}

function genCode() {
  const clinic = val('g-clinic').trim()
  const day = val('g-day')
  if (!clinic || !day) { say('the code needs a clinic code and a date', true); return }
  // The same twelve digits the clinic's own Setup screen would accept: one
  // algorithm, imported, not copied. Works with the internet off.
  $('g-out').textContent = makeCode(clinic, day)
  $('g-note').textContent = `unfreezes ${clinic} until ${day}. Read it down the phone in threes.`
}

export function boot() {
  ;($('c-url') as HTMLInputElement).value = cfg.url
  ;($('c-key') as HTMLInputElement).value = cfg.key
  $('c-save').addEventListener('click', () => {
    cfg.url = val('c-url'); cfg.key = val('c-key'); load()
  })
  $('reload').addEventListener('click', load)
  $('f-save').addEventListener('click', saveClinic)
  $('f-rotate').addEventListener('click', rotateLink)
  $('f-del').addEventListener('click', removeClinic)
  $('f-new').addEventListener('click', () => openClinic(val('f-code') || ''))
  $('g-go').addEventListener('click', genCode)
  if (cfg.key) load()
  else say('paste the SA key (wrangler secret put SA_KEY) and press Save')
}

boot()
