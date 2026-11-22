import logoSvg from '../../logo.svg?raw'

// Drop mark path (viewBox 0 0 2010 2000), straight from the brand file
export const LOGO_D = logoSvg.match(/<path d="([^"]*)"/)[1].split(/\s+/).join(' ')
export const LOGO_VB = [2010, 2000]

// Higed metrics (units per em = 1000): cap height of "H" is 701
export const CAP = 0.701

// Ease rules for this brand: long ease-outs, no bounce, no overshoot
export const EASE = { out: 'expo.out', quart: 'quart.out', inOut: 'power3.inOut', soft: 'sine.inOut' }

export const W = 1080, H = 1920    // design canvas: the portrait screen

export const DEFAULT_ROWS = [
  'ONLY *CUP NO CAP KACHA HAUS', 'ABSOLUTELY *DESIGNED LOVE YOU CUP', '*IF I WERE YOU I WOULD DRINK',
  'MYSELF TOO *KACHA HAUS ONLY CUP', 'LOVE YOU *CUP NO CAP', 'KACHA HAUS *ABSOLUTELY DESIGNED',
  'I WOULD *DRINK MYSELF TOO', 'NO *CAP ONLY CUP IF I WERE YOU', '*KACHA *HAUS LOVE YOU CUP', 'ABSOLUTELY DESIGNED *MYSELF TOO'
]

// "ONLY *CUP" -> [['ONLY', false], ['CUP', true]]   (* = solid word, others outline)
export function parseRows (rows) {
  return (rows || DEFAULT_ROWS).map(line => String(line).split(/\s+/).filter(Boolean)
    .map(w => w[0] === '*' ? [w.slice(1).toUpperCase(), true] : [w.toUpperCase(), false])).filter(r => r.length)
}

// Width of a word in em at the Higed font (measured once, cached)
const ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null
const widths = new Map()
export function emWidth (text) {
  if (widths.has(text)) return widths.get(text)
  ctx.font = '100px Higed'
  const w = ctx.measureText(text).width / 100
  widths.set(text, w)
  return w
}
