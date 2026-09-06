import { useState } from 'react'
import { THEMES, theme, setTheme } from '../theme'

/** Light / Dark / Device, as three chips on one row. Used in the header menu
 *  and in Setup so the switch is where a doctor looks for it either way. */
export function ThemeRow({ label = 'Screen', labelSd }: { label?: string; labelSd?: string }) {
  const [cur, setCur] = useState(theme())
  return (
    <div className="themerow" role="radiogroup" aria-label="Light or dark screen">
      <span className="tr-l">{label}{labelSd && <i className="sd">{labelSd}</i>}</span>
      <div className="tr-c">
        {THEMES.map(t => (
          <button key={t.id} type="button" role="radio" aria-checked={cur === t.id}
                  className={'tr-b' + (cur === t.id ? ' on' : '')}
                  onClick={() => { setTheme(t.id); setCur(t.id) }}>
            {t.en}<i className="sd">{t.sd}</i>
          </button>
        ))}
      </div>
    </div>
  )
}
