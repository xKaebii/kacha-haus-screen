import React, { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { LOGO_D, CAP, EASE, W, H, emWidth } from '../lib/brand.js'

// one beat per item; "/" splits a beat into stacked rows (keep short words like "I" with a neighbour)
const BEATS = ['IF I', 'WERE / YOU', 'I WOULD', 'DRINK', 'MYSELF', 'TOO']
const PAD = 40, GAP = 18, F = 200, STRETCH = 1.7

// Stack a beat's words as full-width rows, each as tall as fits (stretched up to STRETCH x its natural height)
function layout (phrase) {
  const words = phrase.split('/').map(s => s.trim()).filter(Boolean)
  const fit = W - 2 * PAD
  const nat = words.map(w => CAP * F * (fit / (emWidth(w) * F)))           // cap height when the word fills the width
  const maxH = H * 0.74, n = words.length
  let k = Math.min(STRETCH, (maxH - GAP * (n - 1)) / nat.reduce((a, b) => a + b, 0))
  const hs = nat.map(h => h * k), total = hs.reduce((a, b) => a + b, 0) + GAP * (n - 1)
  let y = (H - total) / 2
  return words.map((w, i) => { const r = { w, y, h: hs[i] }; y += hs[i] + GAP; return r })
}

/* 3 · ONE LINE, ONE BEAT
   The line "IF I WERE YOU I WOULD DRINK MYSELF TOO", one beat at a time, each beat filling the screen.
   Rows cut in from below inside their own slots. Twist: the last word is drawn as an outline that fills up with
   milk from the bottom, then settles into the drop logo. */
export default function Beat ({ cfg }) {
  const svg = useRef(null)
  const beats = (cfg.beat && cfg.beat.lines) || BEATS
  const plans = useMemo(() => beats.map(layout), [beats.join('|')])
  const id = useMemo(() => 'b' + Math.random().toString(36).slice(2, 7), [])

  useEffect(() => {
    const root = svg.current
    const groups = [...root.querySelectorAll('[data-beat]')]
    const last = groups[groups.length - 1]
    const milk = root.querySelector('[data-milk]'), wave = root.querySelector('[data-wave]')
    const outline = last.querySelectorAll('[data-outline]'), logo = root.querySelector('[data-logo]')
    const ghost = root.querySelector('[data-ghost]')
    const lastPlan = plans[plans.length - 1]
    const top = Math.min(...lastPlan.map(r => r.y)), bottom = Math.max(...lastPlan.map(r => r.y + r.h))

    gsap.set(groups, { opacity: 1 })
    const tl = gsap.timeline({ repeat: -1 })
    groups.forEach((g, gi) => {
      const rows = g.querySelectorAll('[data-move]')
      const isLast = gi === groups.length - 1
      tl.set(g, { visibility: 'visible' })
      tl.fromTo(rows, { y: (i, el) => +el.dataset.h * 1.15 }, { y: 0, duration: 0.8, ease: EASE.out, stagger: 0.07 })
      if (!isLast) {
        tl.to(rows, { y: (i, el) => -(+el.dataset.h * 1.15), duration: 0.55, ease: 'power3.in', stagger: 0.05 }, '+=0.55')
        tl.set(g, { visibility: 'hidden' })
      }
    })
    // twist: milk rises inside the last word, then the word gives way to the drop
    tl.fromTo(milk, { attr: { y: bottom + 40 } }, { attr: { y: top - 60 }, duration: 2.4, ease: EASE.quart }, '+=0.2')
    tl.to(outline, { opacity: 0, duration: 0.6, ease: EASE.quart }, '-=0.5')
    tl.to(last, { opacity: 0, scale: 0.94, transformOrigin: '50% 50%', duration: 0.9, ease: EASE.quart }, '+=0.5')
    tl.fromTo(logo, { opacity: 0, scale: 0.86, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 1.6, ease: EASE.out }, '-=0.5')
    tl.to(logo, { opacity: 0, duration: 1.0, ease: EASE.quart }, '+=2.4')
    tl.set(last, { visibility: 'hidden', opacity: 1, scale: 1 })
    tl.set(outline, { opacity: 1 })
    tl.set(milk, { attr: { y: bottom + 40 } })

    // the wave on the milk surface drifts sideways, forever
    const w = gsap.to(wave, { x: -240, duration: 2.2, ease: 'none', repeat: -1 })
    // faint outline words drifting upward behind everything
    const g = gsap.fromTo(ghost, { y: 0 }, { y: -640, duration: 40, ease: 'none', repeat: -1 })
    return () => { tl.kill(); w.kill(); g.kill() }
  }, [plans])

  const lastIdx = plans.length - 1
  return (
    <svg ref={svg} className="fill" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      <defs>
        {plans.map((rows, gi) => rows.map((r, ri) => (
          <clipPath key={gi + '-' + ri} id={`${id}-c${gi}-${ri}`}><rect x="0" y={r.y - 2} width={W} height={r.h + 4} /></clipPath>
        )))}
        <clipPath id={`${id}-last`}>
          {plans[lastIdx].map((r, i) => (
            <text key={i} x={PAD} y="0" fontSize={F} textLength={W - 2 * PAD} lengthAdjust="spacingAndGlyphs" fontFamily="Higed"
              transform={`translate(0 ${r.y + r.h}) scale(1 ${r.h / (CAP * F)})`}>{r.w}</text>
          ))}
        </clipPath>
      </defs>
      <rect width={W} height={H} fill="var(--bg)" />
      <g data-ghost opacity="0.1">
        {Array.from({ length: 14 }, (_, i) => (
          <text key={i} x={W / 2} y={160 + i * 160} fontSize="150" textAnchor="middle" fill="none" stroke="var(--fg)" strokeWidth="2.5" fontFamily="Higed">KACHA HAUS</text>
        ))}
      </g>
      {plans.map((rows, gi) => (
        <g key={gi} data-beat visibility="hidden">
          {rows.map((r, ri) => (
            <g key={ri} clipPath={`url(#${id}-c${gi}-${ri})`}>
              <g data-move data-h={r.h}>
                <text x={PAD} y="0" fontSize={F} textLength={W - 2 * PAD} lengthAdjust="spacingAndGlyphs" fontFamily="Higed"
                  transform={`translate(0 ${r.y + r.h}) scale(1 ${r.h / (CAP * F)})`}
                  {...(gi === lastIdx ? { fill: 'none', stroke: 'var(--fg)', strokeWidth: 3 / (r.h / (CAP * F)), 'data-outline': '' } : { fill: 'var(--fg)' })}>{r.w}</text>
              </g>
            </g>
          ))}
          {gi === lastIdx && (
            <g clipPath={`url(#${id}-last)`}>
              <g data-milk-wrap>
                <rect data-milk x="0" y={H} width={W} height={H} fill="var(--fg)" />
              </g>
            </g>
          )}
        </g>
      ))}
      {/* wave crest that rides on top of the milk */}
      <MilkWave id={id} />
      <g transform={`translate(${W / 2 - 2010 * 0.21} ${H / 2 - 2000 * 0.21}) scale(0.42)`}>
        <path data-logo d={LOGO_D} fill="var(--fg)" opacity="0" />
      </g>
    </svg>
  )
}

// The crest is a separate path clipped to the same last word, tied to the milk rect's top edge
function MilkWave ({ id }) {
  const ref = useRef(null)
  useEffect(() => {
    const crest = ref.current, root = crest.ownerSVGElement
    const milk = root.querySelector('[data-milk]')
    let raf
    const tick = () => { crest.setAttribute('transform', `translate(0 ${+milk.getAttribute('y') - 34})`); raf = requestAnimationFrame(tick) }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])
  let d = 'M -240 34'
  for (let x = -240; x < W + 480; x += 120) d += ` Q ${x + 30} 4 ${x + 60} 34 T ${x + 120} 34`
  d += ` L ${W + 480} 80 L -240 80 Z`
  return (
    <g clipPath={`url(#${id}-last)`}>
      <g ref={ref}><path data-wave d={d} fill="var(--fg)" /></g>
    </g>
  )
}
