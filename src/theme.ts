/**
 * LIGHT, DARK, OR WHATEVER THE DEVICE SAYS.
 *
 * Asked for by the doctors who work the evening clinic with the room lights
 * low. The choice lives on the device, not in the clinic's records: a phone
 * held by one doctor and the laptop at the desk are allowed to disagree.
 *
 * "light" is the default, on purpose. Every doctor learned the app in light,
 * and a phone that happens to be set to dark must not change the app under
 * him the day this ships. He chooses "device" himself, and from then on the
 * phone decides.
 *
 * The printed slip never reads this: slip.css names every colour it uses.
 */
export type Theme = 'light' | 'dark' | 'device'
const KEY = 'nk-theme'

/* Sindhi reviewed 6 Sep 2026 (Safeer, via the same review that approved the
   SOS strings). Screen labels only; nothing here prints. */
export const THEMES: { id: Theme; en: string; sd: string }[] = [
  { id: 'light',  en: 'Light',  sd: 'روشن' },
  { id: 'dark',   en: 'Dark',   sd: 'اونداهو' },
  { id: 'device', en: 'Device', sd: 'ڊوائيس' },
]
/** The heading over the switch in Setup, both scripts. */
export const THEME_LABEL = { en: 'This screen: light or dark', sd: 'هيءَ اسڪرين: روشن يا اونداهي' }

export function theme(): Theme {
  try {
    const t = localStorage.getItem(KEY)
    return t === 'dark' || t === 'device' ? t : 'light'
  } catch { return 'light' }
}

/** Put the choice on <html>. "device" removes the attribute so the media
 *  query in app.css is what decides; index.html runs the same three lines
 *  before the app loads so a dark page never flashes white first. */
export function applyTheme(t: Theme): void {
  const el = document.documentElement
  if (t === 'device') el.removeAttribute('data-theme')
  else el.setAttribute('data-theme', t)
  const dark = t === 'dark' || (t === 'device' && matchMedia('(prefers-color-scheme:dark)').matches)
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#0f1614' : '#0f5c4a')
}

export function setTheme(t: Theme): void {
  try { localStorage.setItem(KEY, t) } catch { /* private mode: the choice lasts the session */ }
  applyTheme(t)
}
