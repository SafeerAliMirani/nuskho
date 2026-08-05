import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname, normalize } from 'node:path'
import { networkInterfaces } from 'node:os'
import { WebSocketServer } from 'ws'

/**
 * THE BUILDING'S WIRE, AND WHY IT IS DELIBERATELY STUPID.
 *
 * This little program runs on any one computer in the clinic and does exactly
 * two dumb jobs: it hands the app's files to every phone and tab on the
 * building's own wifi, and it passes messages between them like a corridor
 * passes voices. It keeps NOTHING. No database, no log of messages, no file it
 * writes, no memory that survives a restart. The records live in the browser
 * of the one machine the clinic chose as the record holder, exactly as they
 * did before this program existed.
 *
 * That stupidity is the security model. A relay that cannot store cannot
 * leak, cannot be subpoenaed for records it does not have, and cannot make
 * the About page's promise a lie. If a future change wants this file to
 * remember anything about a patient, the answer is no.
 *
 * It also never touches the internet. It binds to the machine's own address
 * on the local network and serves whoever is inside the wifi. The wifi
 * password is the building's front gate, and the role PINs checked by the
 * record holder are the doors inside.
 *
 * Run it in the clinic folder:  node tools/nuskho-wifi.cjs
 * It prints the address every phone should open. That is the whole manual.
 */

const PORT = +(process.env.PORT || 8123)
const DIST = process.argv[2] || 'dist'

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json',
  '.json': 'application/json', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
}

const server = createServer((req, res) => {
  const url = (req.url || '/').split('?')[0]

  // The one honest signal the app uses to know it is inside a building.
  // Solo folders and the public web copy get a 404 here and stay themselves.
  if (url === '/hub.json') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' })
    res.end(JSON.stringify({ hub: true, name: 'nuskho-wifi', v: 1 }))
    return
  }

  // Static files, nothing clever. Path traversal is refused by normalising
  // and refusing anything that still tries to climb out.
  let p = normalize(url).replace(/^([/\\])+/, '').replace(/\\/g, '/')
  if (p.includes('..')) { res.writeHead(403); res.end(); return }
  if (p === '' || p === '/') p = 'index.html'
  let file = join(DIST, p)
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, 'index.html')
  try {
    const body = readFileSync(file)
    res.writeHead(200, {
      'content-type': MIME[extname(file)] || 'application/octet-stream',
      // phones must pick up a new build on reload; the wire is fast and local
      'cache-control': 'no-cache',
    })
    res.end(body)
  } catch {
    res.writeHead(404); res.end('not found')
  }
})

/**
 * The relay. Every connection gets a number. Every message is stamped with
 * the number it came from. A message with a `to` goes to that number alone;
 * anything else goes to everyone else. The relay never reads further into a
 * message than those two fields, on purpose: what the desk says to the record
 * holder is not this program's business.
 */
const wss = new WebSocketServer({ server, path: '/bus' })
let nextId = 1
const socks = new Map()

wss.on('connection', ws => {
  const id = nextId++
  socks.set(id, ws)
  ws.send(JSON.stringify({ t: 'you', id }))

  ws.on('message', raw => {
    let m
    try { m = JSON.parse(String(raw)) } catch { return }
    if (!m || typeof m !== 'object') return
    m.from = id
    const out = JSON.stringify(m)
    if (m.to && socks.has(m.to)) {
      const s = socks.get(m.to)
      if (s.readyState === 1) s.send(out)
      return
    }
    for (const [k, s] of socks) {
      if (k !== id && s.readyState === 1) s.send(out)
    }
  })

  const bye = () => {
    if (!socks.has(id)) return
    socks.delete(id)
    const out = JSON.stringify({ t: 'gone', from: id })
    for (const s of socks.values()) if (s.readyState === 1) s.send(out)
  }
  ws.on('close', bye)
  ws.on('error', bye)
})

// dead sockets are reaped so a phone that fell off the wifi does not linger
setInterval(() => {
  for (const s of socks.values()) {
    if (s.isAlive === false) { s.terminate(); continue }
    s.isAlive = false
    try { s.ping() } catch { /* reaped next round */ }
  }
}, 10000)
wss.on('connection', ws => {
  ws.isAlive = true
  ws.on('pong', () => { ws.isAlive = true })
})

server.listen(PORT, () => {
  const nets = networkInterfaces()
  const addrs = []
  for (const list of Object.values(nets)) {
    for (const n of list || []) {
      if (n.family === 'IPv4' && !n.internal) addrs.push(n.address)
    }
  }
  console.log('')
  console.log('  Nuskho wifi — the building\'s own wire. No internet involved.')
  console.log('')
  for (const a of addrs) console.log(`  Phones and tabs on this wifi open:  http://${a}:${PORT}`)
  if (!addrs.length) console.log(`  Open:  http://localhost:${PORT}`)
  console.log('')
  console.log('  This program keeps no records. The clinic machine that is marked')
  console.log('  "holds the records" in Setup is the only place anything lives.')
  console.log('')
})
