/* KINETIC — a port of "Kinetic Typography with Three.js" by Mario Carrillo (marioecg) for Codrops, 2020.
   https://tympanus.net/codrops/2020/06/02/kinetic-typography-with-three-js/
   https://github.com/marioecg/codrops-kinetic-typo · MIT License · Copyright (c) 2009 - 2020 Codrops

   Same idea and shaders as the original: a word is drawn into a texture, the texture is repeated over a 3D shape
   by a shader, four shapes sit on a circle and the scene turns from one to the next.
   Changes for the shop screen: words/colours/font come from config, the word texture is drawn on a canvas instead
   of three-bmfont-text, each shape is scaled to fit a portrait screen, and the background eases between colours. */
import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import '@fontsource/orbitron/900.css'
import '@fontsource/montserrat-alternates/700.css'
import '@fontsource/archivo-black/400.css'
import '@fontsource/open-sans/600.css'

//----------------- shaders (from the original, colours made uniforms) -----------------//
const torusVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float uTime;
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  }
`
const torusFragment = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float uTime;
  uniform sampler2D uTexture;
  uniform vec3 uShade;
  void main() {
    float time = uTime * 0.4;
    vec2 repeat = -vec2(12., 3.);
    vec2 uv = fract(vUv * repeat - vec2(time, 0.));
    vec3 texture = texture2D(uTexture, uv).rgb;
    float fog = clamp(vPosition.z / 6., 0., 1.);
    vec3 fragColor = mix(uShade, texture, fog);
    gl_FragColor = vec4(fragColor, 1.);
  }
`
const sphereFragment = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float uTime;
  uniform sampler2D uTexture;
  uniform vec3 uShade;
  void main() {
    float time = uTime * 1.5;
    vec2 repeat = vec2(12., 12.);
    vec2 uv = fract(vUv * repeat + vec2(sin(vUv.y * 1.) * 5., time));
    vec3 texture = texture2D(uTexture, uv).rgb;
    float depth = vPosition.z / 10.;
    vec3 fragColor = mix(uShade, texture, depth);
    gl_FragColor = vec4(fragColor, 1.);
  }
`
const boxVertex = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  mat4 rotation3d(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    return mat4(
      oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
      oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
      oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
      0.0,                                0.0,                                0.0,                                1.0
    );
  }
  vec3 rotate(vec3 v, vec3 axis, float angle) { return (rotation3d(axis, angle) * vec4(v, 1.0)).xyz; }
  void main() {
    vUv = uv;
    vec3 pos = position;
    vec3 axis = vec3(1., 0., 0.);
    float twist = 0.1;
    float angle = pos.x * twist;
    vec3 transformed = rotate(pos, axis, angle);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.);
  }
`
const boxFragment = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform sampler2D uTexture;
  void main() {
    float time = uTime * 0.25;
    vec2 uv = fract(vUv * 3. - vec2(time, 0.));
    vec3 texture = texture2D(uTexture, uv).rgb;
    gl_FragColor = vec4(texture, 1.);
  }
`
const planeVertex = /* glsl */ `
  varying vec2 vUv;
  varying float vWave;
  uniform float uTime;
  void main() {
    vUv = uv;
    vec3 pos = position;
    float freq = 0.5;
    float amp = 1.;
    float time = uTime * 3.5;
    pos.z += sin((pos.x - pos.y) * freq - time) * amp;
    vWave = pos.z;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
  }
`
const planeFragment = /* glsl */ `
  varying vec2 vUv;
  varying float vWave;
  uniform float uTime;
  uniform sampler2D uTexture;
  float map(float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
  }
  void main() {
    vec2 repeat = vec2(4., 16.);
    vec2 uv = fract(vUv * repeat);
    vec3 texture = texture2D(uTexture, uv).rgb;
    float wave = map(vWave, -1., 1., 0., 0.1);
    float shadow = 1. - wave;
    gl_FragColor = vec4(texture * shadow, 1.);
  }
`

// The four demos. Original words: ENDLESS, SWIRL, TWISTED, RELAX. Colours: page bg / text / texture fill.
const DEMOS = [
  { key: 'endless', word: 'KACHA', font: '900 {px}px Orbitron', bg: '#000000', color: '#ffffff', fill: '#000000', shade: '#000000',
    geometry: () => new THREE.TorusKnotGeometry(9, 3, 768, 3, 4, 3), vertex: torusVertex, fragment: torusFragment, grow: 1.25 },
  { key: 'swirl', word: 'HAUS', font: '700 {px}px "Montserrat Alternates"', bg: '#3e64ff', color: '#ffffff', fill: '#3e64ff', shade: '#0000cc',
    geometry: () => new THREE.SphereGeometry(12, 64, 64), vertex: torusVertex, fragment: sphereFragment },
  { key: 'twisted', word: 'NO CAP', font: '400 {px}px "Archivo Black"', bg: '#d8345f', color: '#ffffff', fill: '#d8345f', shade: '#000000',
    geometry: () => new THREE.BoxGeometry(100, 10, 10, 64, 64, 64), vertex: boxVertex, fragment: boxFragment, portrait: [0, 0, Math.PI / 2], thick: 0.42 },
  { key: 'relax', word: 'ONLY CUP', font: '600 {px}px "Open Sans"', bg: '#f2f3f3', color: '#ffffff', fill: '#e3e6e5', shade: '#000000',
    geometry: () => new THREE.PlaneGeometry(27, 27, 64, 64), vertex: planeVertex, fragment: planeFragment }
]
const BRAND = [
  { bg: '#12131c', color: '#f1f1f6', fill: '#12131c', shade: '#000000' },
  { bg: '#15152a', color: '#f4f4ff', fill: '#15152a', shade: '#05050d' },
  { bg: '#1c1e33', color: '#f1f1f6', fill: '#1c1e33', shade: '#000000' },
  { bg: '#f1f1f6', color: '#ffffff', fill: '#dcdde6', shade: '#000000' }
]
export const KINETIC_KEYS = DEMOS.map(d => d.key)

// The word texture: what the original renders into a render target, drawn on a canvas (16:9 tile)
function wordTexture (word, font, color, fill, renderer) {
  const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 1152
  const g = cv.getContext('2d')
  g.fillStyle = fill; g.fillRect(0, 0, cv.width, cv.height)
  let px = 400; g.font = font.replace('{px}', px)
  const m = g.measureText(word)
  px = Math.min(px * (cv.width * 0.94) / m.width, cv.height * 0.8)
  g.font = font.replace('{px}', px); g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'
  g.fillText(word, cv.width / 2, cv.height * 0.55)
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
  tex.minFilter = THREE.LinearMipmapLinearFilter
  return tex
}

export default function Kinetic ({ cfg, opts }) {
  const host = useRef(null)

  useEffect(() => {
    const el = host.current
    const k = cfg.kinetic || {}
    const only = KINETIC_KEYS.indexOf(opts && opts.type)          // a single demo, or -1 = the turning carousel
    const words = k.words || DEMOS.map(d => d.word)
    const brand = k.palette === 'brand', higed = k.font !== 'original'
    const demos = DEMOS.map((d, i) => ({ ...d, ...(brand ? BRAND[i] : {}), word: String(words[i] || d.word).toUpperCase(), font: higed ? '{px}px Higed' : d.font }))
    const hold = +(k.hold || 6)

    let disposed = false
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    el.appendChild(renderer.domElement)
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 1000)
    camera.position.z = 1
    const scene = new THREE.Scene(), ring = new THREE.Group(); scene.add(ring)
    const clock = new THREE.Clock()
    const bg = new THREE.Color(demos[Math.max(0, only)].bg); renderer.setClearColor(bg)
    const parts = []

    const build = () => Promise.all(demos.map(d => document.fonts.load(d.font.replace('{px}', '100')).catch(() => {}))).then(() => {
      if (disposed) return
      demos.forEach((d, i) => {
        if (only >= 0 && i !== only) return
        const tex = wordTexture(d.word, d.font, d.color, d.fill, renderer)
        const mat = new THREE.ShaderMaterial({
          vertexShader: d.vertex, fragmentShader: d.fragment, side: THREE.DoubleSide, defines: { PI: Math.PI },
          uniforms: { uTime: { value: 0 }, uTexture: { value: tex }, uShade: { value: new THREE.Color(d.shade) } }
        })
        const geo = d.geometry()
        const mesh = new THREE.Mesh(geo, mat)
        // as in the original: four shapes on a circle of radius 50, each facing the centre
        const angle = (only >= 0 ? 0 : i / demos.length) * Math.PI * 2 + Math.PI * 1.5
        const holder = new THREE.Group()
        holder.position.set(50 * Math.cos(angle), 0, 50 * Math.sin(angle))
        holder.lookAt(new THREE.Vector3())
        holder.add(mesh); ring.add(holder)
        parts.push({ d, mesh, tex, mat, geo })
      })
      fit()
    })

    // Portrait screens: turn the long box upright and scale each shape to fit the narrow side
    const fit = () => {
      const w = el.clientWidth || innerWidth, h = el.clientHeight || innerHeight
      renderer.setSize(w, h, false); renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%'
      camera.aspect = w / h; camera.updateProjectionMatrix()
      const halfH = 50 * Math.tan(THREE.MathUtils.degToRad(22.5)), halfW = halfH * camera.aspect
      for (const p of parts) {
        const portrait = camera.aspect < 1
        p.mesh.rotation.set(...(portrait && p.d.portrait ? p.d.portrait : [0, 0, 0]))
        p.geo.computeBoundingBox()
        const b = p.geo.boundingBox, sx = (b.max.x - b.min.x) / 2, sy = (b.max.y - b.min.y) / 2
        const [ex, ey] = portrait && p.d.portrait ? [sy, sx] : [sx, sy]
        // like the original on a wide screen, the long bar runs off both ends: size it by its thickness instead
        const s = portrait && p.d.thick ? (2 * halfW * p.d.thick) / (2 * Math.min(sx, sy))
          : Math.min(1, (halfW * 0.96 * (portrait ? p.d.grow || 1 : 1)) / ex, (halfH * 0.96) / ey)
        p.mesh.scale.setScalar(s)
      }
    }
    addEventListener('resize', fit)

    // Turn from one shape to the next, like clicking through the original demo's menu
    let tl
    if (only < 0) {
      const state = { i: 0 }
      tl = gsap.timeline({ repeat: -1, delay: hold })
      demos.forEach((_, i) => {
        const next = demos[(i + 1) % demos.length]
        tl.to(ring.rotation, { y: `+=${Math.PI / 2}`, duration: 1.5, ease: 'expo.inOut' })
        tl.to(bg, { r: new THREE.Color(next.bg).r, g: new THREE.Color(next.bg).g, b: new THREE.Color(next.bg).b, duration: 1.5, ease: 'expo.inOut',
          onUpdate: () => renderer.setClearColor(bg), onComplete: () => { state.i = (i + 1) % demos.length } }, '<')
        tl.to({}, { duration: hold })
      })
    }

    let raf
    const loop = () => {
      const t = clock.getElapsedTime()
      for (const p of parts) p.mat.uniforms.uTime.value = t
      renderer.render(scene, camera)
      raf = requestAnimationFrame(loop)
    }
    build().then(() => { if (!disposed) loop() })

    return () => {
      disposed = true; cancelAnimationFrame(raf); tl && tl.kill(); removeEventListener('resize', fit)
      parts.forEach(p => { p.tex.dispose(); p.mat.dispose(); p.geo.dispose() })
      renderer.dispose(); renderer.domElement.remove()
    }
  }, [JSON.stringify(cfg.kinetic || {}), opts && opts.type])

  return <div ref={host} className="fill" />
}
