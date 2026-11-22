import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { LOGO_D, CAP, EASE, parseRows } from '../lib/brand.js'

const A = 6, B = 6 * 1920 / 1080      // tunnel cross-section matches the portrait screen
const LEN = 64, T = 20                 // wall length, and the length one texture tile covers

// One seamless tile of words for a wall: rows of solid / outline words running along x
function wallTexture (rows, worldW, worldH, renderer, seed) {
  const pxPerUnit = 2048 / worldW
  const cv = document.createElement('canvas'); cv.width = 2048; cv.height = Math.round(worldH * pxPerUnit)
  const g = cv.getContext('2d')
  const nRows = Math.max(2, Math.round(worldH / 2.1)), rowH = cv.height / nRows, cap = rowH * 0.62, fpx = cap / CAP
  g.font = `${fpx}px Higed`; g.textBaseline = 'alphabetic'; g.lineJoin = 'round'
  g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineWidth = fpx * 0.03
  for (let r = 0; r < nRows; r++) {
    const words = rows[(r + seed) % rows.length], base = (r + 0.5) * rowH + cap / 2
    let x = -((r * 337 + seed * 191) % 600), k = 0
    while (x < cv.width) {
      const [w, solid] = words[k++ % words.length], ww = g.measureText(w).width
      for (const xx of [x, x - cv.width]) solid ? g.fillText(w, xx, base) : g.strokeText(w, xx, base)
      x += ww + fpx * 0.34
    }
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(LEN / T, 1)
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy(); tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function logoTexture (color) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1024
  const g = cv.getContext('2d'), s = 1024 / 2010
  g.scale(s, s); g.fillStyle = color; g.fill(new Path2D(LOGO_D))
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/* 2 · TUNNEL DIVE
   Walls of words rushing past: the camera dives down a tunnel made of the LED sign's words, surging and settling.
   Twist: the walls fall away into the dark and the drop logo glides up out of the depth, then holds, alone. */
export default function Tunnel ({ cfg }) {
  const host = useRef(null)

  useEffect(() => {
    const el = host.current
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    el.appendChild(renderer.domElement)
    const bg = new THREE.Color(cfg.bg), fg = new THREE.Color(cfg.fg)
    const scene = new THREE.Scene(); scene.background = bg; scene.fog = new THREE.Fog(bg, 7, 44)
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 120)

    const rows = parseRows(cfg.rows)
    const walls = []
    const addWall = (w, h, pos, rot, sign, seed) => {
      const tex = wallTexture(rows, T, h, renderer, seed)
      const mat = new THREE.MeshBasicMaterial({ map: tex, color: fg, transparent: true, opacity: 1, depthWrite: false, side: THREE.DoubleSide })
      const m = new THREE.Mesh(new THREE.PlaneGeometry(LEN, h, 64, 1), mat)   // many segments: fog is per vertex
      m.position.set(...pos); m.rotation.set(...rot)
      scene.add(m); walls.push({ m, tex, mat, sign })
    }
    addWall(LEN, B, [-A / 2, 0, -LEN / 2], [0, Math.PI / 2, 0], 1, 0)          // left  (text runs into the distance)
    addWall(LEN, B, [A / 2, 0, -LEN / 2], [0, -Math.PI / 2, 0], -1, 3)        // right (text runs toward you)
    addWall(LEN, A, [0, -B / 2, -LEN / 2], [-Math.PI / 2, 0, Math.PI / 2], 1, 5)  // floor
    addWall(LEN, A, [0, B / 2, -LEN / 2], [Math.PI / 2, 0, -Math.PI / 2], 1, 7)   // ceiling

    const ltex = logoTexture('#fff')
    const lmat = new THREE.MeshBasicMaterial({ map: ltex, color: fg, transparent: true, opacity: 0, depthWrite: false, fog: false })
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2 * 2000 / 2010), lmat)
    logo.position.set(0, 0, -50); scene.add(logo)

    const st = { speed: 70, walls: 1, logo: 0, lz: -50, roll: 0 }
    const tl = gsap.timeline({ repeat: -1 })
    tl.set(st, { speed: 70, walls: 1, logo: 0, lz: -50 })
    tl.fromTo(st, { walls: 0 }, { walls: 1, duration: 1.0, ease: EASE.quart }, 0)
    tl.to(st, { speed: 9, duration: 2.6, ease: EASE.out }, 0)
    tl.to(st, { speed: 34, duration: 0.5, ease: 'power2.in' }, '+=1.4')
    tl.to(st, { speed: 8, duration: 2.0, ease: EASE.out })
    tl.to(st, { speed: 40, duration: 0.5, ease: 'power2.in' }, '+=1.2')
    tl.to(st, { speed: 6, duration: 2.0, ease: EASE.out })
    // twist: walls fall away, the drop rises out of the depth and holds
    tl.to(st, { walls: 0, duration: 1.4, ease: EASE.quart }, '+=0.4')
    tl.to(st, { speed: 2, duration: 1.4, ease: EASE.quart }, '<')
    tl.to(st, { logo: 1, duration: 1.2, ease: EASE.quart }, '<0.3')
    tl.to(st, { lz: -7.4, duration: 2.6, ease: EASE.out }, '<')
    tl.to(st, { logo: 0, duration: 1.0, ease: EASE.quart }, '+=2.4')
    const rollTw = gsap.to(st, { roll: 0.06, duration: 7, ease: EASE.soft, yoyo: true, repeat: -1 })

    const resize = () => {
      const w = el.clientWidth || innerWidth, h = el.clientHeight || innerHeight
      renderer.setSize(w, h, false); renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%'
      camera.aspect = w / h
      // keep the tunnel mouth framing the screen whatever its shape
      camera.fov = 2 * Math.atan(Math.max(1, (1080 / 1920) / camera.aspect) * Math.tan(THREE.MathUtils.degToRad(30))) * 180 / Math.PI
      camera.updateProjectionMatrix()
    }
    resize(); addEventListener('resize', resize)

    let raf, last = performance.now()
    const loop = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      for (const w of walls) { w.tex.offset.x += w.sign * st.speed * dt / T; w.mat.opacity = st.walls }
      lmat.opacity = st.logo; logo.position.z = st.lz
      camera.rotation.z = st.roll
      renderer.render(scene, camera)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf); tl.kill(); rollTw.kill(); removeEventListener('resize', resize)
      walls.forEach(w => { w.tex.dispose(); w.mat.dispose(); w.m.geometry.dispose() })
      ltex.dispose(); lmat.dispose(); logo.geometry.dispose()
      renderer.dispose(); renderer.domElement.remove()
    }
  }, [cfg.rows, cfg.bg, cfg.fg])

  return <div ref={host} className="fill" />
}
