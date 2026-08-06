/**
 * Every picture in the app, drawn in code.
 *
 * WHY DRAWN AND NOT DOWNLOADED
 *
 * The app has to run from a folder on a clinic laptop with the internet down,
 * which rules out an icon CDN and a stock photo library both. It also has to
 * stay small enough to send over a Larkana connection when we ship an update.
 * And a photograph of a smiling doctor is a stock photograph of somebody else's
 * doctor: it says nothing true about this clinic, and it dates.
 *
 * So the artwork is geometry. It is a few kilobytes, it works offline, it is
 * ours, it scales to any screen without blurring, and it takes the colour of
 * whatever it sits inside because every stroke is `currentColor`. On a black
 * and white laser printer it still reads, which matters for the two of these
 * that can end up on paper.
 *
 * All of it is decoration, none of it is information. Every drawing here sits
 * beside words that say the same thing. A doctor who cannot make out a small
 * green line drawing has lost nothing at all.
 */

type P = { size?: number; className?: string }

const box = (size: number, className?: string) => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const, className, 'aria-hidden': true,
})

/* ------------------------------------------------------------------ icons */

export const IcQueue = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <path d="M4 6h10M4 12h10M4 18h6" /><circle cx="19" cy="6" r="1.6" />
    <circle cx="19" cy="12" r="1.6" /><circle cx="19" cy="18" r="1.6" />
  </svg>
)

export const IcChart = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
)

export const IcCog = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.6v2.6M12 18.8v2.6M21.4 12h-2.6M5.2 12H2.6M18.6 5.4l-1.8 1.8M7.2 16.8l-1.8 1.8M18.6 18.6l-1.8-1.8M7.2 7.2 5.4 5.4" />
  </svg>
)

export const IcLock = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.2" />
    <path d="M8 10.5V7.4a4 4 0 0 1 8 0v3.1" /><circle cx="12" cy="15.4" r="1.1" fill="currentColor" stroke="none" />
  </svg>
)

export const IcPrint = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <path d="M7 9V3.5h10V9" /><rect x="3.5" y="9" width="17" height="7.5" rx="2" />
    <rect x="7" y="14" width="10" height="6.5" rx="1.2" fill="#fff" />
    <circle cx="17.2" cy="11.8" r=".9" fill="currentColor" stroke="none" />
  </svg>
)

export const IcUser = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <circle cx="12" cy="8" r="3.6" /><path d="M4.6 20.2a7.6 7.6 0 0 1 14.8 0" />
  </svg>
)

export const IcPill = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <rect x="2.6" y="8.6" width="18.8" height="6.8" rx="3.4" transform="rotate(-40 12 12)" />
    <path d="M9.2 6.6 17.4 14.8" />
  </svg>
)

/**
 * A BANKNOTE, NOT A CURRENCY LETTER, AND THE REASON MATTERS.
 *
 * This used to draw ₹, the Indian rupee: two bars and a stem. Safeer spotted it
 * on the token counter's own door. Pakistan's rupee is ₨ or plain Rs, and a
 * Larkana clinic being handed software with India's currency sign on the money
 * button is not a small blemish, it is the kind of thing a doctor mentions to
 * every other doctor he knows.
 *
 * The replacement is a banknote rather than ₨, on purpose. ₨ is a two letter
 * ligature that turns to mush at the 13 pixels this is drawn at in the fee row,
 * and every place this icon appears already writes the amount as "Rs 500" in
 * words beside it. So the picture carries "money" and the text carries the
 * currency, which is the division of labour the rest of this file follows.
 */
export const IcMoney = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <rect x="2.4" y="5.8" width="19.2" height="12.4" rx="2.4" />
    <circle cx="12" cy="12" r="2.9" />
    <path d="M6 9.5v5M18 9.5v5" />
  </svg>
)

export const IcScan = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <path d="M3.5 8V5.4a2 2 0 0 1 2-2H8M16 3.4h2.5a2 2 0 0 1 2 2V8M20.5 16v2.6a2 2 0 0 1-2 2H16M8 20.6H5.5a2 2 0 0 1-2-2V16" />
    <path d="M6.6 12h10.8" />
  </svg>
)

export const IcBack = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}><path d="M15 5.5 8 12l7 6.5" /></svg>
)

export const IcCheck = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}><path d="M4.6 12.6 9.4 17.4 19.4 6.8" /></svg>
)

export const IcPlus = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}><path d="M12 5v14M5 12h14" /></svg>
)

export const IcSearch = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}><circle cx="10.8" cy="10.8" r="6.4" /><path d="M15.6 15.6 20.4 20.4" /></svg>
)

/* ------------------------------------------------------------- the mark */

/**
 * The Nuskho mark: a sheet with three ruled lines and a stamped seal.
 *
 * A prescription is the only thing this software makes, so the mark is a
 * prescription. It is drawn rather than lettered so that it reads the same at
 * 20 pixels in a header and at 200 in the sign-in card.
 */
export const Mark = ({ size = 40, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
    <rect x="8" y="4.5" width="32" height="39" rx="4" fill="currentColor" opacity=".08" />
    <rect x="8" y="4.5" width="32" height="39" rx="4" stroke="currentColor" strokeWidth="2.4" />
    <path d="M15 15.5h13M15 22h18M15 28.5h10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="31" cy="33.5" r="6.2" fill="currentColor" opacity=".14" />
    <path d="M27.6 33.8l2.4 2.4 4.6-5" stroke="currentColor" strokeWidth="2.4"
          strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/* ----------------------------------------------------------- illustration */

/**
 * The welcome picture: a printed slip with the dose pictograms on it.
 *
 * It is a drawing of the actual product. Somebody who has never been told what
 * this software does can look at it and see a piece of paper with a sun, a
 * midday sun and a moon on it, which is precisely the pitch.
 */
export const ArtSlip = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 260 190" className={className} fill="none" aria-hidden>
    <defs>
      <linearGradient id="nk-g1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--g)" stopOpacity=".10" />
        <stop offset="1" stopColor="var(--g)" stopOpacity=".02" />
      </linearGradient>
    </defs>

    {/* One sheet behind, peeking from the lower left, because there is always
        another patient. It sits BEHIND an opaque front sheet: a translucent
        slip lets the one underneath show through its own rows, which reads as a
        printing fault rather than as a stack. */}
    <rect x="50" y="26" width="146" height="152" rx="9" fill="#fff" fillOpacity=".55"
          stroke="var(--g)" strokeOpacity=".3" strokeWidth="2" transform="rotate(-7 123 102)" />

    {/* the slip */}
    <rect x="62" y="12" width="152" height="164" rx="9" fill="#fff" />
    <rect x="62" y="12" width="152" height="164" rx="9" fill="url(#nk-g1)" />
    <rect x="62" y="12" width="152" height="164" rx="9" fill="none"
          stroke="var(--g)" strokeWidth="2.4" />
    <path d="M62 44h152" stroke="var(--g)" strokeWidth="2.8" />
    <path d="M78 26h56M78 34h34" stroke="var(--g)" strokeWidth="3" strokeLinecap="round" opacity=".85" />

    {/* three medicine rows */}
    {[62, 92, 122].map((y, i) => (
      <g key={y}>
        <path d={`M78 ${y}h${[74, 58, 66][i]}`} stroke="var(--ink)" strokeOpacity=".6"
              strokeWidth="3.4" strokeLinecap="round" />
        <path d={`M78 ${y + 9}h${[40, 52, 34][i]}`} stroke="var(--ink)" strokeOpacity=".2"
              strokeWidth="2.6" strokeLinecap="round" />
        {/* morning, midday, night, filled only where a dose is due */}
        <circle cx="172" cy={y + 2} r="5.2" fill={i !== 1 ? 'var(--g)' : 'none'}
                stroke="var(--g)" strokeWidth="1.8" />
        <circle cx="188" cy={y + 2} r="5.2" fill={i === 1 ? 'var(--g)' : 'none'}
                stroke="var(--g)" strokeWidth="1.8" />
        <circle cx="204" cy={y + 2} r="5.2" fill={i !== 2 ? 'var(--g)' : 'none'}
                stroke="var(--g)" strokeWidth="1.8" />
      </g>
    ))}

    {/* the scannable square in the corner */}
    <g transform="translate(78 140)" opacity=".9">
      <rect width="26" height="26" rx="2" stroke="var(--ink)" strokeOpacity=".35" strokeWidth="1.6" />
      <rect x="4" y="4" width="7" height="7" fill="var(--ink)" fillOpacity=".55" />
      <rect x="15" y="4" width="7" height="7" fill="var(--ink)" fillOpacity=".55" />
      <rect x="4" y="15" width="7" height="7" fill="var(--ink)" fillOpacity=".55" />
      <rect x="16" y="16" width="4" height="4" fill="var(--ink)" fillOpacity=".55" />
    </g>
    <path d="M116 150h44M116 160h30" stroke="var(--ink)" strokeOpacity=".22"
          strokeWidth="2.6" strokeLinecap="round" />
  </svg>
)

/** Nobody waiting. Shown where a list would be, so the screen is never blank. */
export const ArtEmpty = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 120" className={className} fill="none" aria-hidden>
    <ellipse cx="100" cy="104" rx="62" ry="7" fill="currentColor" opacity=".07" />
    <rect x="52" y="26" width="96" height="66" rx="8" stroke="currentColor" strokeOpacity=".3" strokeWidth="2.4" />
    <path d="M70 48h60M70 62h44M70 76h28" stroke="currentColor" strokeOpacity=".18"
          strokeWidth="3.4" strokeLinecap="round" />
    <circle cx="100" cy="26" r="9" fill="var(--bg)" stroke="currentColor" strokeOpacity=".3" strokeWidth="2.4" />
    <path d="M96.4 26h7.2" stroke="currentColor" strokeOpacity=".4" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
)

/** For the test print step: a printer with a sheet coming out of it. */
export const ArtPrinter = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 140" className={className} fill="none" aria-hidden>
    <rect x="58" y="14" width="84" height="34" rx="4" stroke="currentColor" strokeOpacity=".3" strokeWidth="2.4" />
    <path d="M74 28h44M74 38h28" stroke="currentColor" strokeOpacity=".22" strokeWidth="3" strokeLinecap="round" />
    <rect x="40" y="48" width="120" height="42" rx="8" fill="currentColor" fillOpacity=".07"
          stroke="currentColor" strokeOpacity=".45" strokeWidth="2.6" />
    <circle cx="142" cy="60" r="3.6" fill="currentColor" opacity=".55" />
    <rect x="62" y="86" width="76" height="34" rx="4" fill="#fff" stroke="currentColor" strokeWidth="2.6" />
    <path d="M76 98h48M76 108h32" stroke="currentColor" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" />
  </svg>
)

/* ==========================================================================
   MORE ICONS

   One geometry for all of them: a 24 box, 1.7 stroke, round caps, currentColor.
   That consistency is the whole point — an icon set where the strokes disagree
   looks worse than no icons at all, because the eye reads the inconsistency
   before it reads the meaning.

   Every icon here sits BESIDE a word, never instead of one. Half this app's
   users will be reading it in their second language and the other half will be
   reading it at speed with a queue outside, and neither of them should have to
   decode a picture.
   ========================================================================== */

export const IcWarn = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <path d="M12 3.6 21.4 20H2.6L12 3.6z" /><path d="M12 9.6v4.6" />
    <circle cx="12" cy="17.2" r="1" fill="currentColor" stroke="none" />
  </svg>
)

export const IcInfo = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <circle cx="12" cy="12" r="8.8" /><path d="M12 11.2v5" />
    <circle cx="12" cy="7.9" r="1" fill="currentColor" stroke="none" />
  </svg>
)

export const IcStop = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <circle cx="12" cy="12" r="8.8" /><path d="M8.6 8.6l6.8 6.8M15.4 8.6l-6.8 6.8" />
  </svg>
)

export const IcShield = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <path d="M12 3.2 19.4 6v5.6c0 4.4-3 7.7-7.4 9.2-4.4-1.5-7.4-4.8-7.4-9.2V6L12 3.2z" />
    <path d="M9 12.2l2.2 2.2L15.2 10" />
  </svg>
)

export const IcClock = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}><circle cx="12" cy="12" r="8.8" /><path d="M12 6.8V12l3.4 2" /></svg>
)

export const IcCalendar = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <rect x="3.6" y="5.2" width="16.8" height="15.2" rx="2.4" />
    <path d="M3.6 10h16.8M8.4 3.4v3.4M15.6 3.4v3.4" />
  </svg>
)

export const IcSave = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <path d="M5.6 3.6h9.6l4.2 4.2v12.6H5.6z" /><path d="M8.6 3.6v5.4h6.2V3.6" />
    <rect x="8.2" y="13" width="7.6" height="7.4" />
  </svg>
)

export const IcUpload = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <path d="M12 16.4V4.4M7.6 8.8 12 4.4l4.4 4.4" /><path d="M4.4 15.6v3a2 2 0 0 0 2 2h11.2a2 2 0 0 0 2-2v-3" />
  </svg>
)

export const IcDownload = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <path d="M12 4.4v12M7.6 12 12 16.4 16.4 12" /><path d="M4.4 15.6v3a2 2 0 0 0 2 2h11.2a2 2 0 0 0 2-2v-3" />
  </svg>
)

export const IcTrash = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <path d="M4.4 6.6h15.2M9 6.6V4.4h6v2.2M6.6 6.6l1 13a1.6 1.6 0 0 0 1.6 1.4h5.6a1.6 1.6 0 0 0 1.6-1.4l1-13" />
    <path d="M10.4 10.6v6.4M13.6 10.6v6.4" />
  </svg>
)

export const IcEdit = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <path d="M4.4 19.6h4l10-10a2.4 2.4 0 0 0-3.4-3.4l-10 10v3.4z" /><path d="M13.6 7.4l3 3" />
  </svg>
)

export const IcSun = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" />
  </svg>
)

export const IcMoon = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}><path d="M20 13.4A8.6 8.6 0 1 1 10.6 4a6.8 6.8 0 0 0 9.4 9.4z" /></svg>
)

export const IcStore = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <path d="M3.6 8.4 5.2 4h13.6l1.6 4.4" /><path d="M4.4 8.4v11.2h15.2V8.4" />
    <path d="M3.6 8.4a2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.2 0" />
    <rect x="9.4" y="13" width="5.2" height="6.6" />
  </svg>
)

export const IcBook = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <path d="M4.4 4.6h5.2A2.4 2.4 0 0 1 12 7v13a2 2 0 0 0-2-1.8H4.4z" />
    <path d="M19.6 4.6h-5.2A2.4 2.4 0 0 0 12 7v13a2 2 0 0 1 2-1.8h5.6z" />
  </svg>
)

export const IcRefresh = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <path d="M20 11.4a8 8 0 1 0-.6 4.4" /><path d="M20.4 5.6v5.8h-5.6" />
  </svg>
)

export const IcEye = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <path d="M2.4 12S6 5.6 12 5.6 21.6 12 21.6 12 18 18.4 12 18.4 2.4 12 2.4 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const IcEyeOff = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <path d="M9.4 6a9.6 9.6 0 0 1 2.6-.4c6 0 9.6 6.4 9.6 6.4a17 17 0 0 1-3 3.8M6.4 7.6A17 17 0 0 0 2.4 12s3.6 6.4 9.6 6.4a9.4 9.4 0 0 0 3.4-.6" />
    <path d="M4 4l16 16" />
  </svg>
)

export const IcHeart = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <path d="M12 20.4S3.6 15.4 3.6 9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 8.4 2c0 5.8-8.4 10.8-8.4 10.8z" />
  </svg>
)

export const IcBed = ({ size = 20, className }: P) => (
  <svg {...box(size, className)}>
    <path d="M3 19.6V7.2M3 12h18v7.6M21 19.6v-3" />
    <circle cx="7.6" cy="10" r="2" /><path d="M11 12V9.4h6.4a3.6 3.6 0 0 1 3.6 2.6" />
  </svg>
)

/* ==========================================================================
   MORE PICTURES
   ========================================================================== */

/** A slip coming out of a printer, for the moment after PRINT is pressed. */
export const ArtDone = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 150" className={className} fill="none" aria-hidden>
    <ellipse cx="100" cy="136" rx="58" ry="6" fill="currentColor" opacity=".08" />
    <rect x="46" y="66" width="108" height="40" rx="9" fill="currentColor" fillOpacity=".1"
          stroke="currentColor" strokeWidth="2.6" />
    <circle cx="136" cy="80" r="3.4" fill="currentColor" />
    <rect x="62" y="96" width="76" height="40" rx="5" fill="#fff" stroke="currentColor" strokeWidth="2.6" />
    <path d="M74 110h34M74 121h22" stroke="currentColor" strokeOpacity=".4" strokeWidth="3" strokeLinecap="round" />
    <circle cx="100" cy="34" r="20" fill="currentColor" fillOpacity=".12" />
    <circle cx="100" cy="34" r="20" stroke="currentColor" strokeWidth="2.6" />
    <path d="M91 34.4l6 6 12-13" stroke="currentColor" strokeWidth="3.4"
          strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/** No medicines on the list yet. A shelf with one box on it. */
export const ArtNoDrugs = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 130" className={className} fill="none" aria-hidden>
    <path d="M28 96h144M28 56h144" stroke="currentColor" strokeOpacity=".28" strokeWidth="3" strokeLinecap="round" />
    <rect x="44" y="66" width="26" height="30" rx="3" fill="currentColor" fillOpacity=".13"
          stroke="currentColor" strokeOpacity=".5" strokeWidth="2.2" />
    <path d="M50 76h14" stroke="currentColor" strokeOpacity=".45" strokeWidth="2.4" strokeLinecap="round" />
    <rect x="80" y="72" width="22" height="24" rx="3" stroke="currentColor" strokeOpacity=".25"
          strokeWidth="2.2" strokeDasharray="4 4" />
    <rect x="112" y="72" width="22" height="24" rx="3" stroke="currentColor" strokeOpacity=".25"
          strokeWidth="2.2" strokeDasharray="4 4" />
    <rect x="60" y="28" width="24" height="26" rx="3" fill="currentColor" fillOpacity=".1"
          stroke="currentColor" strokeOpacity=".4" strokeWidth="2.2" />
    <rect x="96" y="34" width="20" height="20" rx="3" stroke="currentColor" strokeOpacity=".25"
          strokeWidth="2.2" strokeDasharray="4 4" />
  </svg>
)

/** Nothing to show on the figures screen yet: axes and a flat line. */
export const ArtNoFigures = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 130" className={className} fill="none" aria-hidden>
    <path d="M32 22v84h140" stroke="currentColor" strokeOpacity=".3" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M46 92h16M74 92h16M102 92h16M130 92h16" stroke="currentColor" strokeOpacity=".18"
          strokeWidth="9" strokeLinecap="round" />
    <path d="M46 76c14 0 14-14 28-14s14 12 28 12 14-16 28-16" stroke="currentColor"
          strokeOpacity=".3" strokeWidth="2.6" strokeDasharray="5 6" strokeLinecap="round" />
  </svg>
)

/** The backup nudge: a pen drive that has never been plugged in. */
export const ArtBackup = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 120" className={className} fill="none" aria-hidden>
    <rect x="40" y="46" width="82" height="30" rx="7" fill="currentColor" fillOpacity=".1"
          stroke="currentColor" strokeWidth="2.6" />
    <path d="M52 61h6M66 61h6M80 61h6" stroke="currentColor" strokeOpacity=".45"
          strokeWidth="3.4" strokeLinecap="round" />
    <rect x="122" y="52" width="22" height="18" rx="3" stroke="currentColor" strokeWidth="2.6" />
    <path d="M144 61h16" stroke="currentColor" strokeWidth="2.6" strokeDasharray="4 5" strokeLinecap="round" />
    <circle cx="168" cy="61" r="5" stroke="currentColor" strokeWidth="2.6" />
  </svg>
)
