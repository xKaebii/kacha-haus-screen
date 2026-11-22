import React, { useEffect, useRef } from 'react'
import { LOGO_D, parseRows } from '../lib/brand.js'

// The original LED sign: diagonal rows of outline / solid words running in opposite directions, drop logo in the middle
export default function Led ({ cfg }) {
  const stage = useRef(null)

  useEffect(() => {
    const el = stage.current
    const rows = parseRows(cfg.rows)
    const angle = cfg.angle ?? -48, size = cfg.size || 15, speed = cfg.speed || 12
    const build = () => {
      el.innerHTML = ''
      const Wv = innerWidth, Hv = innerHeight, diag = Math.ceil(Math.hypot(Wv, Hv)) + 40
      const fontPx = Math.min(Wv, Hv) * size / 100
      Object.assign(el.style, { width: diag + 'px', height: diag + 'px', fontSize: fontPx + 'px', transform: `translate(-50%,-50%) rotate(${angle}deg)` })
      const rowH = fontPx * 0.86, n = Math.ceil(diag / rowH) + 2, scale = Math.min(Wv, Hv) / 1080
      for (let i = 0; i < n; i++) {
        const words = rows[i % rows.length], row = document.createElement('div'), tr = document.createElement('div')
        row.className = 'led-row' + (i % 2 ? ' rev' : ''); row.style.height = rowH + 'px'
        tr.className = 'led-track'; row.appendChild(tr); el.appendChild(row)
        const shift = (i * 3) % words.length, seq = words.slice(shift).concat(words.slice(0, shift))
        const unit = document.createElement('div'); unit.style.display = 'inline-flex'
        seq.forEach(([w, solid]) => { const s = document.createElement('span'); s.className = solid ? 'f' : 'o'; s.textContent = w; unit.appendChild(s) })
        tr.appendChild(unit)
        const base = unit.innerHTML; let guard = 0
        while (unit.offsetWidth < diag && guard++ < 20) unit.innerHTML += base
        const w = unit.offsetWidth; tr.appendChild(unit.cloneNode(true))
        const v = speed * scale * (0.85 + ((i * 7) % 5) * 0.075)
        tr.style.setProperty('--w', w + 'px'); tr.style.setProperty('--dur', (w / v).toFixed(2) + 's')
        tr.style.animationDelay = (-(i * 1.37) % (w / v)).toFixed(2) + 's'
      }
    }
    build()
    let t; const onResize = () => { clearTimeout(t); t = setTimeout(build, 250) }
    addEventListener('resize', onResize)
    return () => { removeEventListener('resize', onResize); clearTimeout(t) }
  }, [cfg])

  const showLogo = String(cfg.logo) !== 'false'
  return (
    <div className="fill">
      <div className="led-stage" ref={stage} />
      {showLogo && (
        <div className="mark" style={{ left: `calc(50% + ${cfg.logoX || 0}vw)`, top: `calc(50% + ${cfg.logoY || 0}vh)`, width: `${cfg.logoSize || 50}vmin` }}>
          <svg viewBox="0 0 2010 2000" aria-label="Kacha Haus">
            <path d={LOGO_D} fill="var(--bg)" stroke="var(--bg)" strokeWidth="280" strokeLinejoin="round" />
            <path d={LOGO_D} fill="var(--fg)" />
          </svg>
        </div>
      )}
    </div>
  )
}
