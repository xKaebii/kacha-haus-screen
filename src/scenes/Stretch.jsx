import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { LOGO_D, CAP, EASE, W, H } from '../lib/brand.js'

const WORDS = ['KACHA', 'HAUS', 'ONLY CUP', 'NO CAP', 'ABSOLUTELY', 'DESIGNED']
const PAD = 36, GAP = 10, F = 200

/* 1 · STRETCH STACK
   Full-width words stacked top to bottom. One word at a time stretches to fill most of the screen while the
   others squeeze into slivers. Twist: the whole stack folds into the centre line and the drop logo opens out of it. */
export default function Stretch ({ cfg }) {
  const svg = useRef(null)
  const words = (cfg.stretch && cfg.stretch.words) || WORDS

  useEffect(() => {
    const root = svg.current
    const rows = [...root.querySelectorAll('[data-row]')]
    const logo = root.querySelector('[data-logo]')
    const n = words.length
    const st = { w: words.map(() => 1), squash: 1, logo: 0 }

    const draw = () => {
      const total = st.w.reduce((a, b) => a + b, 0)
      const avail = (H - 2 * PAD - GAP * (n - 1)) * st.squash
      let y = H / 2 - (avail + GAP * (n - 1) * st.squash) / 2
      rows.forEach((g, i) => {
        const h = avail * st.w[i] / total
        const rect = g.firstChild, text = g.lastChild
        if (h < 1.5) { g.setAttribute('visibility', 'hidden') } else {
          g.setAttribute('visibility', 'visible')
          rect.setAttribute('y', y); rect.setAttribute('height', h)
          const inset = Math.min(h * 0.08, 16), th = Math.max(0.1, h - 2 * inset)
          text.setAttribute('transform', `translate(0 ${y + h - inset}) scale(1 ${th / (CAP * F)})`)
        }
        y += h + GAP * st.squash
      })
      const s = 0.82 + 0.18 * st.logo
      logo.setAttribute('opacity', st.logo)
      logo.setAttribute('transform', `translate(${W / 2} ${H / 2}) scale(${s * 0.42}) translate(-1005 -1000)`)
    }

    const focus = i => words.map((_, k) => k === i ? 7 : 0.22)
    const tl = gsap.timeline({ repeat: -1, onUpdate: draw })
    tl.to(st.w, { endArray: words.map(() => 1), duration: 0 })   // reset in place: the tweens hold this array
    tl.set(st, { squash: 1, logo: 0 })
    tl.from(st, { squash: 0, duration: 1.3, ease: EASE.out })
    words.forEach((_, i) => {
      tl.to(st.w, { endArray: focus(i), duration: 0.95, ease: EASE.out }, '+=0.45')
    })
    tl.to(st.w, { endArray: words.map(() => 1), duration: 0.9, ease: EASE.out }, '+=0.5')
    // twist: fold into the centre, the drop opens out of the line
    tl.to(st, { squash: 0, duration: 1.0, ease: 'power4.in' }, '+=0.6')
    tl.to(st, { logo: 1, duration: 1.8, ease: EASE.out }, '-=0.15')
    tl.to(st, { logo: 0, duration: 1.0, ease: EASE.quart }, '+=2.6')
    draw()
    return () => tl.kill()
  }, [words.join('|')])

  return (
    <svg ref={svg} className="fill" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      <rect width={W} height={H} fill="var(--bg)" />
      {words.map((w, i) => {
        const inv = i % 2 === 1
        return (
          <g key={i} data-row>
            <rect x="0" width={W} fill={inv ? 'var(--fg)' : 'none'} />
            <text x={PAD} y="0" fontSize={F} textLength={W - 2 * PAD} lengthAdjust="spacingAndGlyphs" fill={inv ? 'var(--bg)' : 'var(--fg)'} fontFamily="Higed">{w}</text>
          </g>
        )
      })}
      <path data-logo d={LOGO_D} fill="var(--fg)" opacity="0" />
    </svg>
  )
}
