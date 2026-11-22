/* TYPE — pure GSAP kinetic typography, ported from two Codrops demos (MIT License, Copyright (c) Codrops):
   · "On-Scroll Typography Animations" (2022) — the 15 character effects fx1–fx15
     https://github.com/codrops/OnScrollTypographyAnimations
   · "Kinetic Type Page Transition" (2021) — the rotating wall of lines between rounds
     https://github.com/codrops/KineticTypePageTransition
   The originals are driven by scrolling (ScrollTrigger scrub). Here the same from/to values and staggers play on a
   clock instead: each word comes in with one effect, holds, goes out, and the next word uses the next effect. */
import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import '@fontsource/archivo-black/400.css'

const WORDS = ['KACHA', 'HAUS', 'ONLY CUP', 'NO CAP', 'CHINESE', 'MILK TEA', 'ABSOLUTELY', 'DESIGNED', 'LOVE YOU', 'CUP']
const LINES = ['KACHA HAUS KACHA HAUS', 'ONLY CUP ONLY CUP', 'NO CAP NO CAP NO CAP', 'MILK TEA MILK TEA', 'ABSOLUTELY ABSOLUTELY', 'DESIGNED DESIGNED']
const SYMBOLS = 'abcdefghijklmnopqrstuvwxyz!@#$%^&*-_+=;:<>,'.split('')
const rnd = gsap.utils.random

// Each effect = the original fromTo (from, to) for the chars; `words: true` = the original ran it per word
const FX = [
  /* fx1 */ { from: () => ({ opacity: 0, scale: 0.6, rotationZ: () => rnd(-20, 20) }), to: { ease: 'power4', opacity: 1, scale: 1, rotation: 0, stagger: 0.4 } },
  /* fx2 */ { from: () => ({ opacity: 0, yPercent: 120, scaleY: 2.3, scaleX: 0.7, transformOrigin: '50% 0%' }), to: { duration: 1, ease: 'back.inOut(2)', opacity: 1, yPercent: 0, scaleY: 1, scaleX: 1, stagger: 0.03 } },
  /* fx3 */ { from: () => ({ transformOrigin: '50% 0%', scaleY: 0 }), to: { ease: 'back', opacity: 1, scaleY: 1, yPercent: 0, stagger: 0.03 } },
  /* fx4 */ { words: true, from: () => ({ x: (i, _, arr) => 150 * (i - arr.length / 2) }), to: { ease: 'power1.inOut', x: 0, stagger: { grid: 'auto', from: 'center' } } },
  /* fx5 */ { from: () => ({ opacity: 0, xPercent: () => rnd(-200, 200), yPercent: () => rnd(-150, 150) }), to: { ease: 'power1.inOut', opacity: 1, xPercent: 0, yPercent: 0, stagger: { each: 0.05, grid: 'auto', from: 'random' } } },
  /* fx6 */ { words: true, persp: true, from: () => ({ opacity: 0, rotationX: -90, yPercent: 50 }), to: { ease: 'power1.inOut', opacity: 1, rotationX: 0, yPercent: 0, stagger: { each: 0.03, from: 0 } } },
  /* fx7 */ { words: true, persp: true, from: () => ({ transformOrigin: '100% 50%', opacity: 0, rotationY: -90, z: -300 }), to: { ease: 'expo', opacity: 1, rotationY: 0, z: 0, stagger: { each: 0.06, from: 'end' } } },
  /* fx8 */ { scramble: true },
  /* fx9 */ { words: true, from: () => ({ scaleX: 0, x: (_, t) => t.closest('.ty-word').offsetWidth / 2 - t.offsetLeft - t.offsetWidth / 2 }), to: { ease: 'power1.inOut', scaleX: 1, x: 0 } },
  /* fx10 */ { from: () => ({ opacity: 0, filter: 'blur(20px)' }), to: { duration: 0.25, ease: 'power1.inOut', opacity: 1, filter: 'blur(0px)', stagger: { each: 0.05, from: 'random' } } },
  /* fx11 */ { wrap: true, from: () => ({ transformOrigin: '0% 50%', xPercent: 105 }), to: { duration: 1, ease: 'expo', xPercent: 0, stagger: 0.042 } },
  /* fx12 */ { wrap: true, from: () => ({ xPercent: -250, rotationZ: 45, scaleX: 6, transformOrigin: '100% 50%' }), to: { duration: 1, ease: 'power2', xPercent: 0, rotationZ: 0, scaleX: 1, stagger: -0.06 } },
  /* fx13 */ { persp: true, from: () => ({ opacity: 0, rotationY: 180, xPercent: -40, yPercent: 100 }), to: { ease: 'power4.inOut', opacity: 1, rotationY: 0, xPercent: 0, yPercent: 0, stagger: { each: -0.03, from: 0 } } },
  /* fx14 */ { title: { xPercent: 100 }, from: () => ({ scale: 3, yPercent: -900 }), to: { ease: 'back(2)', scale: 1, yPercent: 0, stagger: 0.05 } },
  /* fx15 */ { title: { xPercent: -80 }, persp: true, from: () => ({ transformOrigin: '50% 50% -200px', rotationX: 380, opacity: 0 }), to: { ease: 'expo.inOut', rotationX: 0, z: 0, opacity: 1, stagger: -0.03 } }
]

// Split a phrase into .ty-word > (.ty-wrap >) .ty-char spans, like Splitting.js does for the originals
function split (el, text, wrap) {
  el.innerHTML = ''
  const chars = []
  text.split(' ').forEach((w, wi) => {
    if (wi) { const s = document.createElement('span'); s.className = 'ty-space'; s.textContent = ' '; el.appendChild(s) }
    const word = document.createElement('span'); word.className = 'ty-word'
    for (const c of w) {
      const ch = document.createElement('span'); ch.className = 'ty-char'; ch.textContent = c
      if (wrap) { const wr = document.createElement('span'); wr.className = 'ty-wrap'; wr.appendChild(ch); word.appendChild(wr) } else word.appendChild(ch)
      chars.push(ch)
    }
    el.appendChild(word)
  })
  return chars
}

export default function Type ({ cfg }) {
  const host = useRef(null)
  const t = cfg.type || {}
  const words = (t.words && t.words.length ? t.words : WORDS).map(w => String(w).toUpperCase())
  const font = t.font === 'higed' ? 'Higed' : '"Archivo Black"'

  useEffect(() => {
    const root = host.current
    const title = root.querySelector('.ty-title'), wall = root.querySelector('.ty-wall')
    const lines = [...wall.children]
    const IN = +(t.inTime || 1.2), HOLD = +(t.hold || 1.1), OUT = +(t.outTime || 0.6), EVERY = +(t.wallEvery || 4)
    let alive = true, tl

    // fit the word to ~88% of the screen width (max 26% of the height)
    const fit = () => {
      title.style.fontSize = '100px'
      const w = title.scrollWidth || 1
      title.style.fontSize = Math.min(innerWidth * 0.88 / w * 100, innerHeight * 0.26) + 'px'
    }

    // the wall of lines: rotate -90deg, scale up, lines slide away (Kinetic Type Page Transition "in", then its "out")
    const wallIn = () => gsap.timeline()
      .set(wall, { opacity: 1 })
      .to(wall, { duration: 1.4, ease: 'power2.inOut', scale: 2.7, rotate: -90 })
      .to(lines, { keyframes: [{ x: '20%', duration: 1, ease: 'power1.inOut' }, { x: '-200%', duration: 1.5, ease: 'power1.in' }], stagger: 0.04 }, 0)
      .to(lines, { keyframes: [{ opacity: 1, duration: 1, ease: 'power1.in' }, { opacity: 0, duration: 1.5, ease: 'power1.in' }] }, 0)
    const wallOut = () => gsap.timeline()
      .to(wall, { duration: 1.4, ease: 'power2.inOut', scale: 1, rotate: 0 }, 1.2)
      .to(lines, { duration: 2.3, ease: 'back', x: '0%', stagger: -0.04 }, 0)
      .to(lines, { keyframes: [{ opacity: 1, duration: 1, ease: 'power1.in' }, { opacity: 0.06, duration: 1.5, ease: 'power1.in' }] }, 0)

    const play = i => {
      if (!alive) return
      const fx = FX[i % FX.length], text = words[i % words.length]
      const chars = split(title, text, fx.wrap); fit()
      gsap.set(title, { xPercent: 0, opacity: 1 })
      const parents = fx.persp ? [...title.querySelectorAll('.ty-word')] : []
      gsap.set(parents, { perspective: 2000 })
      tl = gsap.timeline({ onComplete: () => play(i + 1) })

      if (fx.scramble) {
        // fx8: every char flickers through two random symbols, one after another, then settles
        chars.forEach((c, p) => {
          const final = c.textContent
          tl.set(c, { opacity: 0 }, 0)
          tl.to(c, { duration: 0.03, opacity: 1, repeat: 1, repeatDelay: 0.03, onRepeat: () => { c.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)] },
            onStart: () => { c.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)] }, onComplete: () => { c.textContent = final } }, (p + 1) * 0.09)
        })
        tl.to({}, { duration: HOLD })
        tl.to(chars, { opacity: 0, duration: OUT * 0.6, stagger: { each: 0.03, from: 'random' }, ease: 'power1.in' })
      } else {
        // in: the original fromTo, squeezed into IN seconds
        const groups = fx.words ? [...title.querySelectorAll('.ty-word')].map(w => [...w.querySelectorAll('.ty-char')]) : [chars]
        const intl = gsap.timeline()
        groups.forEach(g => intl.fromTo(g, { ...fx.from() }, { ...fx.to }, 0))
        if (fx.title) intl.fromTo(title, fx.title, { xPercent: 0, ease: 'none', duration: intl.duration() }, 0)
        intl.duration(IN)
        tl.add(intl)
        tl.to({}, { duration: HOLD })
        // out: back towards where the effect started, quicker
        const outtl = gsap.timeline()
        groups.forEach(g => { const f = fx.from(); delete f.transformOrigin; outtl.to(g, { ...f, opacity: 0, ease: 'power3.in', duration: 0.5, stagger: 0.025 }, 0) })
        outtl.duration(OUT)
        tl.add(outtl)
      }
      if ((i + 1) % EVERY === 0) { tl.add(wallIn()); tl.add(wallOut(), '-=0.6') }
    }

    gsap.set(lines, { opacity: 0.06 })
    play(0)
    const onResize = () => fit(); addEventListener('resize', onResize)
    return () => { alive = false; tl && tl.kill(); gsap.killTweensOf([wall, ...lines]); removeEventListener('resize', onResize) }
  }, [words.join('|'), font, JSON.stringify(t)])

  return (
    <div ref={host} className="fill ty" style={{ fontFamily: font }}>
      <div className="ty-wall" aria-hidden="true">{Array.from({ length: 11 }, (_, i) => <div key={i} className="ty-line">{(t.lines || LINES)[i % (t.lines || LINES).length]}</div>)}</div>
      <div className="ty-stage"><div className="ty-title" /></div>
    </div>
  )
}
