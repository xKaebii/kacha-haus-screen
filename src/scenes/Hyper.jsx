/* HYPER — the LED-showroom "speed ramp typo" reel, built from HyperFrames motion primitives.
   HyperFrames by HeyGen · https://github.com/heygen-com/hyperframes · Apache License 2.0
   Ported (timings, eases and values kept, laid out for a portrait screen, driven by one looping timeline):
     caption-kinetic-slam  — full-screen single words, alternating entrances, keywords in an accent colour
     shutter-slam          — one word thrown through six beats: two translate slams, a scale punch, a turn about each axis
     headline-slam         — scales down into frame, lands with a three-frame shake, drifts, whips up on exit
     char-slam-explode     — glyphs hold in a fixed scatter, then reassemble with a slam and a three-frame shake
     logo-sting            — the mark slams to its final scale and fires one accent ring
   Changes: Kacha Haus words and drop logo; motion blur here follows each element's measured speed
   (HyperFrames integrates it over a shutter window when rendering video); logo-sting's one-frame white flash is left out. */
import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import '@fontsource/anton/400.css'
import '@fontsource/inter/900.css'
import { LOGO_D } from '../lib/brand.js'

const DEF = {
  slamA: ['ONLY', '*CUP', 'NO', '*CAP', 'KACHA', '*HAUS'],
  shutter: 'KACHA',
  headline: 'MILK *TEA',
  explode: 'ABSOLUTELY',
  slamB: ['LOVE', 'YOU', '*CUP'],
  accent: '#FFD700'
}
// char-slam-explode's fixed scatter table (normalised x, y, rotation)
const SCATTER = [[-0.9, -0.038, 0.677], [0.61, 0.716, -0.967], [0.418, 0.575, 0.822], [-0.76, -0.451, 0.944], [-0.621, 0.579, -0.215], [0.714, 0.437, -0.824],
  [0.577, 0.567, 0.464], [0.902, 0.346, 0.016], [-0.526, 0.743, -0.275], [-0.571, -0.353, 0.954], [-0.666, 0.61, -0.075], [-0.122, 0.875, -0.783],
  [-0.141, 0.726, -0.659], [0.606, -0.665, -0.713], [-0.962, 0.131, 0.307], [0.227, 0.813, -0.979]]

const ctx = document.createElement('canvas').getContext('2d')
// largest font size (px) that keeps `text` within maxW and maxH
function fit (text, font, maxW, maxH) {
  ctx.font = font.replace('{px}', 100)
  return Math.min(100 * maxW / Math.max(1, ctx.measureText(text).width), maxH)
}
const plain = w => w.replace(/^\*/, '')

export default function Hyper ({ cfg }) {
  const host = useRef(null)
  const h = { ...DEF, ...(cfg.hyper || {}) }

  useEffect(() => {
    const root = host.current, stage = root.querySelector('.hy-stage')
    const blur = root.querySelector('#hy-blur feGaussianBlur')
    const W = root.clientWidth || innerWidth, H = root.clientHeight || innerHeight
    const cqw = W / 100, cqh = H / 100
    stage.innerHTML = ''
    const mk = (cls, text, font, size, color) => {
      const el = document.createElement('div'); el.className = 'hy-el ' + cls
      if (text != null) el.textContent = text
      Object.assign(el.style, { font: font.replace('{px}', size), color: color || '' })
      stage.appendChild(el); gsap.set(el, { xPercent: -50, yPercent: -50, left: '50%', top: '50%', autoAlpha: 0 })
      return el
    }
    // the shop's Higed everywhere (the originals use Anton and Inter 900)
    const ANTON = '{px}px Higed, Anton, sans-serif', INTER = '{px}px Higed, Inter, sans-serif'
    const accent = h.accent
    const tl = gsap.timeline({ repeat: -1 })
    let current = null

    // ── caption-kinetic-slam: one word per ~0.3 s, four entrances in turn ──
    const slam = (list, at) => {
      list.forEach((raw, wi) => {
        const text = plain(raw), key = raw[0] === '*'
        const size = fit(text, ANTON, W * 0.9, H * 0.42)
        const el = mk('hy-slam', text, ANTON, size, key ? accent : '')
        const start = at + wi * 0.32, end = start + 0.27
        tl.call(() => { current = el }, null, start)
        tl.set(el, { autoAlpha: 1 }, start)
        const mode = wi % 4
        if (mode === 0) tl.fromTo(el, { y: -120 * W / 1920 * 2, opacity: 0 }, { y: 0, opacity: 1, duration: 0.22, ease: 'back.out(1.7)' }, start)
        else if (mode === 1) tl.fromTo(el, { x: -300 * W / 1920 * 2, opacity: 0 }, { x: 0, opacity: 1, duration: 0.2, ease: 'expo.out' }, start)
        else if (mode === 2) tl.fromTo(el, { x: 300 * W / 1920 * 2, opacity: 0 }, { x: 0, opacity: 1, duration: 0.2, ease: 'expo.out' }, start)
        else tl.fromTo(el, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.24, ease: 'back.out(2.2)' }, start)
        tl.to(el, { opacity: 0, duration: 0.1, ease: 'power2.in' }, end)
        tl.set(el, { autoAlpha: 0, x: 0, y: 0, scale: 1 }, end + 0.1)
      })
      return at + list.length * 0.32 + 0.15
    }

    // ── shutter-slam: six beats on one word (cues scaled to 0.62x) ──
    const shutter = at => {
      const k = 0.62, text = plain(h.shutter)
      const el = mk('hy-shutter', text, INTER, fit(text, INTER, W * 0.6, H * 0.14))
      const SLAM = 0.3 * k, TURN = 0.6 * k, TURN_Z = 0.733 * k, CUES = [0, 1.2, 2.4, 3.7, 4.5, 5.233].map(c => at + c * k)
      const SX = 32.1 * cqw * 0.75, SY = 30.5 * cqh * 0.6, E = 'power2.inOut'
      tl.call(() => { current = el }, null, at)
      tl.set(el, { autoAlpha: 1, transformPerspective: 900 }, at)
      tl.fromTo(el, { opacity: 0, scale: 1.3 }, { opacity: 1, scale: 1, duration: 0.18, ease: 'expo.out' }, at)
      ;[SX, -SX, SX, 0].forEach((x, i) => tl.to(el, { x, duration: SLAM, ease: E }, CUES[0] + 0.18 + SLAM * i))
      ;[-SY, SY, -SY, 0].forEach((y, i) => tl.to(el, { y, duration: SLAM, ease: E }, CUES[1] + SLAM * i))
      ;[4.04, 0.466, 4.04, 1].forEach((s, i) => tl.to(el, { scale: s, duration: SLAM, ease: E }, CUES[2] + SLAM * i))
      tl.to(el, { rotationX: 360, duration: TURN, ease: E }, CUES[3])
      tl.to(el, { rotationY: 360, duration: TURN, ease: E }, CUES[4])
      tl.to(el, { rotation: 360, duration: TURN_Z, ease: E }, CUES[5])
      const out = CUES[5] + TURN_Z
      tl.to(el, { opacity: 0, y: -12 * cqh, duration: 0.4 * k, ease: 'power2.in' }, out)
      tl.set(el, { autoAlpha: 0, x: 0, y: 0, rotationX: 0, rotationY: 0, rotation: 0, scale: 1 }, out + 0.4 * k)
      return out + 0.4 * k + 0.05
    }

    // ── headline-slam: in 0.72 (lands at 0.58), three-frame shake, drift, whip up 0.46 ──
    const headline = at => {
      const words = h.headline.split(/\s+/)
      const el = mk('hy-head', null, INTER, fit(words.map(plain).join(' '), INTER, W * 0.86, H * 0.16))
      words.forEach((w, i) => { const s = document.createElement('span'); s.textContent = (i ? ' ' : '') + plain(w); if (w[0] === '*') s.style.color = accent; el.appendChild(s) })
      const HOLD = 1.0, F = 1 / 30
      tl.call(() => { current = el }, null, at)
      tl.set(el, { autoAlpha: 1 }, at)
      tl.fromTo(el, { scale: 1.6, opacity: 0, y: 0 }, { scale: 1, opacity: 1, duration: 0.58, ease: 'expo.out' }, at)
      tl.to(stage, { x: 0.55 * cqw, y: -0.3 * cqh, duration: F, ease: 'power2.out' }, at + 0.58)
      tl.to(stage, { x: -0.38 * cqw, y: 0.2 * cqh, duration: F, ease: 'power2.out' })
      tl.to(stage, { x: 0, y: 0, duration: F, ease: 'power2.out' })
      tl.fromTo(el, { y: 0 }, { y: -0.55 * cqh, duration: HOLD / 2, ease: 'sine.inOut', yoyo: true, repeat: 1, immediateRender: false }, at + 0.72)
      tl.to(el, { y: -120 * cqh, duration: 0.46, ease: 'power4.in' }, at + 0.72 + HOLD)
      tl.set(el, { autoAlpha: 0, y: 0 }, at + 0.72 + HOLD + 0.46)
      return at + 0.72 + HOLD + 0.46 + 0.05
    }

    // ── char-slam-explode: glyphs scattered, return at 0.58 over 0.66 (+0.28 stagger from centre), shake, out 0.4 ──
    const explode = at => {
      const text = plain(h.explode), size = fit(text, INTER, W * 0.86, H * 0.2)
      const el = mk('hy-explode', null, INTER, size)
      const glyphs = Array.from(text).map(c => { const g = document.createElement('span'); g.className = 'hy-glyph'; g.textContent = c === ' ' ? ' ' : c; el.appendChild(g); return g })
      const F = 1 / 30, sc = { x: 9 * cqw * 1.6, y: 10 * cqh * 0.9, r: 12 }
      tl.call(() => { current = el }, null, at)
      tl.set(el, { autoAlpha: 1 }, at)
      glyphs.forEach((g, i) => { const v = SCATTER[i % SCATTER.length]; tl.set(g, { x: v[0] * sc.x, y: v[1] * sc.y, rotation: v[2] * sc.r, scale: 0.82 }, at) })
      tl.fromTo(glyphs, { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: 0.02, ease: 'power2.out' }, at)
      tl.to(glyphs, { x: 0, y: 0, rotation: 0, scale: 1, duration: 0.66, ease: 'back.out(1.7)', stagger: { amount: 0.28, from: 'center' } }, at + 0.58)
      const land = at + 0.58 + 0.66 + 0.28
      tl.to(stage, { x: 0.55 * cqw, y: -0.3 * cqh, duration: F, ease: 'power2.out' }, land)
      tl.to(stage, { x: -0.38 * cqw, y: 0.2 * cqh, duration: F, ease: 'power2.out' })
      tl.to(stage, { x: 0, y: 0, duration: F, ease: 'power2.out' })
      tl.fromTo(el, { y: 0 }, { y: -0.4 * cqh, duration: 0.45, ease: 'sine.inOut', yoyo: true, repeat: 1, immediateRender: false }, land + 0.1)
      tl.to(el, { opacity: 0, scale: 0.96, duration: 0.4, ease: 'power2.in' }, land + 1.1)
      tl.set(el, { autoAlpha: 0, scale: 1 }, land + 1.5)
      return land + 1.55
    }

    // ── logo-sting: slam 1.15 -> 1 over 0.55, one accent ring 0.34 -> 2.4, hold ──
    const sting = at => {
      const size = Math.min(W * 0.62, H * 0.4)
      const el = mk('hy-logo', null, INTER, 10)
      el.innerHTML = `<svg viewBox="0 0 2010 2000" width="${size}" height="${size}"><path d="${LOGO_D}" fill="var(--fg)"/></svg>`
      const ring = mk('hy-ring', null, INTER, 10)
      Object.assign(ring.style, { width: size * 0.9 + 'px', height: size * 0.9 + 'px', borderColor: accent })
      tl.call(() => { current = el }, null, at)
      tl.set(el, { autoAlpha: 1 }, at)
      tl.fromTo(el, { scale: 1.15, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: 'expo.out' }, at)
      tl.set(ring, { autoAlpha: 0.92, scale: 0.34 }, at + 0.55)
      tl.to(ring, { scale: 2.4, opacity: 0, duration: 0.4, ease: 'power3.out' }, at + 0.55)
      tl.to(el, { opacity: 0, duration: 0.6, ease: 'quart.out' }, at + 2.6)
      tl.set([el, ring], { autoAlpha: 0 }, at + 3.2)
      return at + 3.25
    }

    let t = 0.2
    t = slam(h.slamA, t)
    t = shutter(t)
    t = headline(t)
    t = explode(t)
    t = slam(h.slamB, t)
    t = sting(t)
    tl.set({}, {}, t)

    // motion blur from the measured speed of whatever is moving now
    let last = null, lastT = performance.now(), raf
    const tick = now => {
      const dt = Math.max(0.001, (now - lastT) / 1000); lastT = now
      if (current) {
        const p = { x: +gsap.getProperty(current, 'x'), y: +gsap.getProperty(current, 'y'), s: +gsap.getProperty(current, 'scale'),
          r: +gsap.getProperty(current, 'rotation') + +gsap.getProperty(current, 'rotationX') + +gsap.getProperty(current, 'rotationY') }
        if (last && last.el === current) {
          const vx = (p.x - last.x) / dt, vy = (p.y - last.y) / dt, vs = Math.abs(p.s - last.s) / dt, vr = Math.abs(p.r - last.r) / dt
          const bx = Math.min(60, Math.abs(vx) / 70 + vs * 3 + vr / 90), by = Math.min(60, Math.abs(vy) / 70 + vs * 3 + vr / 90)
          blur.setAttribute('stdDeviation', `${bx.toFixed(1)} ${by.toFixed(1)}`)
        }
        last = { ...p, el: current }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { tl.kill(); cancelAnimationFrame(raf); stage.innerHTML = '' }
  }, [JSON.stringify(h)])

  return (
    <div ref={host} className="fill hy">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="hy-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0 0" /></filter>
      </svg>
      <div className="hy-stage" />
    </div>
  )
}
