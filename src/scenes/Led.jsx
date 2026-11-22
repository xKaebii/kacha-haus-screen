import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { LOGO_D, parseRows } from '../lib/brand.js'

/* The original LED sign: diagonal rows of outline / solid words running in opposite directions, drop logo in the middle.
   logoStyle "glass": the drop becomes liquid glass — a second copy of the running words sits inside the drop's shape and is
   bent by a displacement map made from the drop itself (flat in the middle, refracting at the rim), with a glass rim and a
   slow light sweep. The words scroll with CSS animations (cheapest for an endless marquee); GSAP only drives the sweep. */
export default function Led ({ cfg }) {
  const root = useRef(null)

  useEffect(() => {
    const host = root.current
    const main = host.querySelector('.led-stage.main')
    const rows = parseRows(cfg.rows)
    const angle = cfg.angle ?? -48, size = cfg.size || 15, speed = cfg.speed || 12
    const glass = cfg.logoStyle === 'glass' && String(cfg.logo) !== 'false'
    let sweep, disp_scale = 0

    const fillStage = (el, Wv, Hv) => {
      el.innerHTML = ''
      const diag = Math.ceil(Math.hypot(Wv, Hv)) + 40
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

    const build = () => {
      const Wv = host.clientWidth || innerWidth, Hv = host.clientHeight || innerHeight
      fillStage(main, Wv, Hv)
      const box = host.querySelector('.lg-box')
      if (!glass || !box) return
      // the drop's box on screen
      const S = Math.min(Wv, Hv) * (cfg.logoSize || 50) / 100, Sh = S * 2000 / 2010
      const left = Wv / 2 + (cfg.logoX || 0) * Wv / 100 - S / 2, top = Hv / 2 + (cfg.logoY || 0) * Hv / 100 - Sh / 2
      Object.assign(box.style, { left: left + 'px', top: top + 'px', width: S + 'px', height: Sh + 'px' })
      // a copy of the whole sign, lined up with the real one, seen only through the drop
      const world = box.querySelector('.lg-world'), clone = box.querySelector('.led-stage.clone')
      Object.assign(world.style, { left: -left + 'px', top: -top + 'px', width: Wv + 'px', height: Hv + 'px' })
      fillStage(clone, Wv, Hv)
      // displacement map from the drop: a lens. The middle magnifies a little (samples pulled toward the centre),
      // the rim bends strongly along the slope of the drop's blurred silhouette. Red = x shift, green = y shift.
      const M = 256, c1 = document.createElement('canvas'), c2 = document.createElement('canvas')
      c1.width = c1.height = c2.width = c2.height = M
      const g1 = c1.getContext('2d'); g1.fillStyle = '#000'; g1.fillRect(0, 0, M, M)
      g1.save(); g1.scale(M / 2010, M / 2000); g1.fillStyle = '#fff'; g1.fill(new Path2D(LOGO_D)); g1.restore()
      const g2 = c2.getContext('2d'); g2.fillStyle = '#000'; g2.fillRect(0, 0, M, M); g2.filter = `blur(${M * 0.035}px)`; g2.drawImage(c1, 0, 0)
      const src = g2.getImageData(0, 0, M, M).data, a = (x, y) => src[(Math.min(M - 1, Math.max(0, y)) * M + Math.min(M - 1, Math.max(0, x))) * 4] / 255
      const SCALE = 0.16, MAG = 0.06, EDGE = 0.34, R = 3
      let peak = 1e-6
      const gx = new Float32Array(M * M), gy = new Float32Array(M * M)
      for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) {
        const i = y * M + x; gx[i] = a(x + R, y) - a(x - R, y); gy[i] = a(x, y + R) - a(x, y - R); peak = Math.max(peak, Math.hypot(gx[i], gy[i]))
      }
      const out = g2.createImageData(M, M)
      for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) {
        const i = y * M + x, u = x / M - 0.5, v = y / M - 0.5
        const dx = -u * MAG / SCALE + EDGE * gx[i] / peak, dy = -v * MAG / SCALE + EDGE * gy[i] / peak
        out.data[i * 4] = 128 + 255 * Math.max(-0.5, Math.min(0.5, dx)); out.data[i * 4 + 1] = 128 + 255 * Math.max(-0.5, Math.min(0.5, dy))
        out.data[i * 4 + 2] = 128; out.data[i * 4 + 3] = 255
      }
      c1.getContext('2d').putImageData(out, 0, 0)
      g2.filter = `blur(${M * 0.008}px)`; g2.drawImage(c1, 0, 0)       // soften quantisation steps
      disp_scale = S * SCALE
      const img = host.querySelector('#lg-map'), disp = host.querySelector('#lg-disp'), f = host.querySelector('#lg-filter')
      img.setAttribute('href', c2.toDataURL()); img.setAttribute('width', S); img.setAttribute('height', Sh)
      f.setAttribute('width', S); f.setAttribute('height', Sh)
      disp.setAttribute('scale', disp_scale.toFixed(1))
      // light sweep across the glass, slow and eased (no bounce)
      sweep && sweep.kill()
      const band = box.querySelector('.lg-sweep')
      sweep = gsap.timeline({ repeat: -1, repeatDelay: 4.5 }).fromTo(band, { xPercent: -130 }, { xPercent: 130, duration: 2.4, ease: 'power2.inOut' })
    }
    build()
    let t; const onResize = () => { clearTimeout(t); t = setTimeout(build, 250) }
    addEventListener('resize', onResize)
    return () => { removeEventListener('resize', onResize); clearTimeout(t); sweep && sweep.kill() }
  }, [cfg])

  const showLogo = String(cfg.logo) !== 'false'
  const glass = showLogo && cfg.logoStyle === 'glass'
  const mask = `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2010 2000'><path d='${LOGO_D}'/></svg>`)}")`
  return (
    <div className="fill" ref={root}>
      <div className="led-stage main" />
      {showLogo && !glass && (
        <div className="mark" style={{ left: `calc(50% + ${cfg.logoX || 0}vw)`, top: `calc(50% + ${cfg.logoY || 0}vh)`, width: `${cfg.logoSize || 50}vmin` }}>
          <svg viewBox="0 0 2010 2000" aria-label="Kacha Haus">
            <path d={LOGO_D} fill="var(--bg)" stroke="var(--bg)" strokeWidth="280" strokeLinejoin="round" />
            <path d={LOGO_D} fill="var(--fg)" />
          </svg>
        </div>
      )}
      {glass && (
        <>
          <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
            <filter id="lg-filter" x="0" y="0" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feImage id="lg-map" x="0" y="0" preserveAspectRatio="none" result="map" />
              <feDisplacementMap id="lg-disp" in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </svg>
          <div className="lg-box" aria-label="Kacha Haus">
            <div className="lg-clip" style={{ WebkitMaskImage: mask, maskImage: mask }}>
              <div className="lg-glass"><div className="lg-world"><div className="led-stage clone" /></div></div>
              <div className="lg-tint" />
              <div className="lg-sweep" />
            </div>
            <svg className="lg-rim" viewBox="0 0 2010 2000">
              <defs>
                <linearGradient id="lg-edge" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#fff" stopOpacity=".9" />
                  <stop offset=".45" stopColor="#fff" stopOpacity=".25" />
                  <stop offset="1" stopColor="#fff" stopOpacity=".7" />
                </linearGradient>
              </defs>
              <path d={LOGO_D} fill="none" stroke="url(#lg-edge)" strokeWidth="14" strokeLinejoin="round" />
            </svg>
          </div>
        </>
      )}
    </div>
  )
}
