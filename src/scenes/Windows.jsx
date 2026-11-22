import React, { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { LOGO_D, CAP, EASE, W, H, parseRows, emWidth } from '../lib/brand.js'

const FS = 120, PITCH = 112, F = 200

/* 4 · LETTERS AS WINDOWS
   Two giant words, KACHA and HAUS, are windows cut into the dark: through them you see the LED sign running.
   The words slide past each other and crop at the edges. Twist: both words fold into the centre line and the
   window becomes the drop, then the drop fills in solid as the logo. */
export default function Windows ({ cfg }) {
  const svg = useRef(null)
  const id = useMemo(() => 'w' + Math.random().toString(36).slice(2, 7), [])
  const words = (cfg.windows && cfg.windows.words) || ['KACHA', 'HAUS']
  const rows = useMemo(() => {
    const src = parseRows(cfg.rows)
    const diag = Math.hypot(W, H) + 200, n = Math.ceil(diag / PITCH) + 1
    return Array.from({ length: n }, (_, i) => {
      const r = src[i % src.length], shift = (i * 3) % r.length
      const seq = r.slice(shift).concat(r.slice(0, shift))
      const unitW = emWidth(seq.map(([w]) => w + '  ').join('')) * FS
      const reps = Math.ceil((diag + unitW) / unitW) + 1
      return { seq, unitW, reps, y: -diag / 2 + i * PITCH }
    })
  }, [cfg.rows])

  useEffect(() => {
    const root = svg.current
    const tracks = [...root.querySelectorAll('[data-track]')]
    const runs = tracks.map((t, i) => {
      const k = i % rows.length, u = rows[k].unitW, rev = k % 2 === 1, dur = u / (60 + (k * 7 % 5) * 8)
      return gsap.fromTo(t, { x: rev ? -u : 0 }, { x: rev ? 0 : -u, duration: dur, ease: 'none', repeat: -1 })
    })
    const [a, b] = root.querySelectorAll('[data-line]')
    const letters = root.querySelector('[data-letters]')
    const drop = root.querySelector('[data-drop]'), solid = root.querySelector('[data-solid]')
    const tl = gsap.timeline({ repeat: -1 })
    tl.set([a, b], { x: 0 })
    tl.set(drop, { scale: 0, opacity: 1, svgOrigin: '1005 1000' })
    tl.set(solid, { opacity: 0 })
    tl.fromTo(letters, { scaleY: 0, svgOrigin: `${W / 2} ${H / 2}` }, { scaleY: 1, duration: 1.3, ease: EASE.out })
    tl.to(a, { x: -W * 0.3, duration: 3.6, ease: EASE.soft }, '+=0.3')
    tl.to(b, { x: W * 0.3, duration: 3.6, ease: EASE.soft }, '<')
    tl.to(a, { x: 0, duration: 3.0, ease: EASE.soft })
    tl.to(b, { x: 0, duration: 3.0, ease: EASE.soft }, '<')
    // twist: the words fold shut, the drop-shaped window opens, then fills in
    tl.to(letters, { scaleY: 0, svgOrigin: `${W / 2} ${H / 2}`, duration: 0.9, ease: 'power4.in' }, '+=0.2')
    tl.fromTo(drop, { scale: 0, svgOrigin: '1005 1000' }, { scale: 1, duration: 1.7, ease: EASE.out }, '-=0.2')
    tl.fromTo(solid, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: EASE.quart }, '+=1.2')
    tl.to([solid, drop], { opacity: 0, duration: 0.9, ease: EASE.quart }, '+=2.2')
    tl.set(drop, { opacity: 1, scale: 0 })
    tl.set(solid, { opacity: 0 })
    return () => { tl.kill(); runs.forEach(r => r.kill()) }
  }, [rows])

  // each word stretched to ~45% of the screen height, wider than the screen so the edges crop
  const lineH = H * 0.42, span = W * 1.3
  const line = (text, top) => (
    <g data-line>
      <text x={-W * 0.15} y="0" fontSize={F} textLength={span} lengthAdjust="spacingAndGlyphs" fill="#fff" fontFamily="Higed"
        transform={`translate(0 ${top + lineH}) scale(1 ${lineH / (CAP * F)})`}>{text}</text>
    </g>
  )
  const pattern = (
    <g transform={`translate(${W / 2} ${H / 2}) rotate(-48)`}>
      {rows.map((r, i) => (
        <g key={i} transform={`translate(${-(Math.hypot(W, H) + 200) / 2} ${r.y})`}>
          <text data-track fontSize={FS} fontFamily="Higed" style={{ whiteSpace: 'pre' }}>
            {Array.from({ length: r.reps }, () => r.seq).flat().map(([w, s], k) => (
              <tspan key={k} {...(s ? { fill: 'var(--fg)' } : { fill: 'none', stroke: 'var(--fg)', strokeWidth: 2.6 })}>{w + '  '}</tspan>
            ))}
          </text>
        </g>
      ))}
    </g>
  )
  const logoAt = `translate(${W / 2 - 2010 * 0.24} ${H / 2 - 2000 * 0.24}) scale(0.48)`
  return (
    <svg ref={svg} className="fill" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      <defs>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
          <rect width={W} height={H} fill="#000" />
          <g data-letters>{line(words[0], H * 0.06)}{line(words[1] || '', H * 0.52)}</g>
          <g transform={logoAt}><path data-drop d={LOGO_D} fill="#fff" /></g>
        </mask>
      </defs>
      <rect width={W} height={H} fill="var(--bg)" />
      <g opacity="0.09">{pattern}</g>
      <g mask={`url(#${id}-m)`}>{pattern}</g>
      <g transform={logoAt}><path data-solid d={LOGO_D} fill="var(--fg)" opacity="0" /></g>
    </svg>
  )
}
