/* RAMP — speed-ramp kinetic type (pure GSAP).
   The "hyper motion" edit look: every word whips in very fast, slows almost to a stop so it can be read,
   then whips out — a U-shaped speed curve. A directional motion blur and a slight stretch follow the speed,
   so fast = smeared, slow = sharp. Moves rotate: from the right, from the left, from below, a zoom through. */
import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import '@fontsource/archivo-black/400.css'
import { LOGO_D } from '../lib/brand.js'

const WORDS = ['KACHA', 'HAUS', 'ONLY CUP', 'NO CAP', 'CHINESE', 'MILK TEA', 'ABSOLUTELY', 'DESIGNED']
const MOVES = ['right', 'left', 'up', 'zoom']

export default function Ramp ({ cfg }) {
  const host = useRef(null)
  const r = cfg.ramp || {}
  const words = (r.words && r.words.length ? r.words : WORDS).map(w => String(w).toUpperCase())
  const font = r.font === 'archivo' ? '"Archivo Black"' : 'Higed'

  useEffect(() => {
    const root = host.current
    const word = root.querySelector('.rp-word'), text = root.querySelector('.rp-text'), blur = root.querySelector('#rp-blur feGaussianBlur'), logo = root.querySelector('.rp-logo')
    const IN = +(r.inTime || 0.42), DRIFT = +(r.drift || 1.3), OUT = +(r.outTime || 0.36)
    const st = { x: 0, y: 0, s: 1, o: 1 }
    let last = { ...st }, lastT = performance.now(), raf, alive = true, tl

    // motion blur + stretch from the current speed (px per second, and scale per second for the zoom)
    const tick = now => {
      const dt = Math.max(0.001, (now - lastT) / 1000); lastT = now
      const vx = (st.x - last.x) / dt, vy = (st.y - last.y) / dt, vs = (st.s - last.s) / dt
      last = { ...st }
      const bx = Math.min(70, Math.abs(vx) / 90 + Math.abs(vs) * 4), by = Math.min(70, Math.abs(vy) / 90 + Math.abs(vs) * 4)
      blur.setAttribute('stdDeviation', `${bx.toFixed(1)} ${by.toFixed(1)}`)
      const sx = 1 + Math.min(0.6, Math.abs(vx) / 9000), sy = 1 + Math.min(0.6, Math.abs(vy) / 9000)
      word.style.transform = `translate(${st.x}px, ${st.y}px) scale(${st.s * sx}, ${st.s * sy})`
      word.style.opacity = st.o
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const fit = () => {
      word.style.fontSize = '100px'
      const w = text.scrollWidth || 1
      word.style.fontSize = Math.min(innerWidth * 0.9 / w * 100, innerHeight * 0.3) + 'px'
    }

    const play = i => {
      if (!alive) return
      const last = i === words.length
      tl = gsap.timeline({ onComplete: () => play(last ? 0 : i + 1) })
      const W = innerWidth, H = innerHeight
      if (last) {
        // end card: the drop whips in the same way, holds longer, then fades
        text.style.display = 'none'; logo.style.display = 'block'
        tl.set(st, { x: W * 1.4, y: 0, s: 1, o: 1 })
        tl.to(st, { x: W * 0.03, duration: IN, ease: 'expo.out' })
        tl.to(st, { x: 0, duration: DRIFT + 1.6, ease: 'none' })
        tl.to(st, { o: 0, duration: 0.8, ease: 'quart.out' })
        return
      }
      text.style.display = ''; logo.style.display = 'none'
      text.textContent = words[i]; fit()
      const move = MOVES[i % MOVES.length], d = 0.05   // d: how far it drifts while slow (share of the screen)
      if (move === 'right' || move === 'left') {
        const s = move === 'right' ? 1 : -1
        tl.set(st, { x: s * W * 1.4, y: 0, s: 1, o: 1 })
        tl.to(st, { x: s * W * d, duration: IN, ease: 'expo.out' })              // whip in, braking hard
        tl.to(st, { x: -s * W * d, duration: DRIFT, ease: 'none' })             // slow glide: readable
        tl.to(st, { x: -s * W * 1.5, duration: OUT, ease: 'expo.in' })          // whip out
      } else if (move === 'up') {
        tl.set(st, { x: 0, y: H * 1.1, s: 1, o: 1 })
        tl.to(st, { y: H * d, duration: IN, ease: 'expo.out' })
        tl.to(st, { y: -H * d, duration: DRIFT, ease: 'none' })
        tl.to(st, { y: -H * 1.2, duration: OUT, ease: 'expo.in' })
      } else {
        // zoom through: comes from huge, settles, then flies past the camera
        tl.set(st, { x: 0, y: 0, s: 9, o: 0 })
        tl.to(st, { s: 1.04, o: 1, duration: IN, ease: 'expo.out' })
        tl.to(st, { s: 0.96, duration: DRIFT, ease: 'none' })
        tl.to(st, { s: 16, o: 0, duration: OUT + 0.08, ease: 'expo.in' })
      }
    }
    play(0)
    addEventListener('resize', fit)
    return () => { alive = false; tl && tl.kill(); cancelAnimationFrame(raf); removeEventListener('resize', fit) }
  }, [words.join('|'), font, JSON.stringify(r)])

  return (
    <div ref={host} className="fill rp" style={{ fontFamily: font }}>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="rp-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0 0" /></filter>
      </svg>
      <div className="rp-stage">
        <div className="rp-word">
          <span className="rp-text" />
          <svg className="rp-logo" viewBox="0 0 2010 2000" style={{ display: 'none' }}><path d={LOGO_D} fill="var(--fg)" /></svg>
        </div>
      </div>
    </div>
  )
}
