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

/* English only until the three Sindhi words are reviewed; they are queued in
   the project's sindhi-to-translate list, and nothing here prints. */
export const THEMES: { id: Theme; en: string }[] = [
  { id: 'light',  en: 'Light' },
  { id: 'dark',   en: 'Dark' },
  { id: 'device', en: 'Device' },
]

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
