import React, { useEffect, useMemo, useRef, useState } from 'react'
import Led from './scenes/Led.jsx'
import Stretch from './scenes/Stretch.jsx'
import Tunnel from './scenes/Tunnel.jsx'
import Beat from './scenes/Beat.jsx'
import Windows from './scenes/Windows.jsx'
import Kinetic from './scenes/Kinetic.jsx'
import Type from './scenes/Type.jsx'
import Ramp from './scenes/Ramp.jsx'
import Hyper from './scenes/Hyper.jsx'
import Block from './scenes/Block.jsx'
import { watchConfig } from './lib/firebase.js'

const SCENES = { led: Led, portal: Block, glass: Block, hyper: Hyper, ramp: Ramp, type: Type, kinetic: Kinetic, endless: Kinetic, swirl: Kinetic, twisted: Kinetic, relax: Kinetic, stretch: Stretch, tunnel: Tunnel, beat: Beat, windows: Windows }
const q = new URLSearchParams(location.search)
const FADE = 1200

const DEFAULT = { mode: 'led', bg: '#12131c', fg: '#f1f1f6' }

// Fetch a JSON file without the browser cache
function getJSON (name) {
  return fetch(name + '?t=' + Date.now(), { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
}

// Values from the URL win over config.json (handy for testing: ?scene=tunnel&bg=15152a)
function withUrl (cfg) {
  const c = { ...DEFAULT, ...cfg }
  for (const [k, v] of q.entries()) if (!['scene', 'debug', '_v'].includes(k)) c[k] = /^-?\d+(\.\d+)?$/.test(v) ? +v : v
  for (const k of ['bg', 'fg']) if (c[k] && c[k][0] !== '#') c[k] = '#' + c[k]
  return c
}

// What to play: one scene from the URL, the playlist, or the single mode
function sequence (cfg) {
  if (q.get('scene')) return [{ type: q.get('scene'), seconds: 0 }]
  const on = Array.isArray(cfg.scenes) ? cfg.scenes.filter(s => s && !s.off && s.type) : []
  if (cfg.mode === 'playlist' && on.length) return on
  return [{ type: cfg.mode, seconds: 0 }]
}

export default function App () {
  const [cfg, setCfg] = useState(null)
  const [idx, setIdx] = useState(0)
  const [on, setOn] = useState(false)
  const leaving = useRef(false)

  // Settings: live from Firebase (the control page) when set there, else config.json checked every minute.
  // New page code (build.json) fades out and reloads once.
  const live = useRef(false)
  useEffect(() => {
    const put = c => setCfg(prev => JSON.stringify(prev) === JSON.stringify(c) ? prev : c)
    const load = () => live.current || getJSON('config.json').then(c => live.current || put(c), () => setCfg(prev => prev || {}))
    const stop = watchConfig(v => { live.current = !!v; v ? put(v) : load() }, () => { live.current = false })
    const check = () => getJSON('build.json').then(({ build }) => {
      if (!build || build === __BUILD__ || q.get('_v') === build || leaving.current) return
      leaving.current = true; setOn(false)
      setTimeout(() => { const u = new URLSearchParams(location.search); u.set('_v', build); location.replace(location.pathname + '?' + u) }, FADE + 300)
    }, () => {})
    load()
    const t = setInterval(() => { load(); check() }, 60 * 1000)
    const r = setTimeout(() => { leaving.current = true; setOn(false); setTimeout(() => location.reload(), FADE + 300) }, 6 * 3600 * 1000)
    return () => { clearInterval(t); clearTimeout(r); stop() }
  }, [])

  const conf = useMemo(() => cfg && withUrl(cfg), [cfg])
  const seq = useMemo(() => conf ? sequence(conf) : [], [conf])
  const item = seq[idx % Math.max(1, seq.length)]

  // Colours + remembered background
  useEffect(() => {
    if (!conf) return
    const bg = conf.mode === 'black' ? '#000' : conf.bg
    document.documentElement.style.setProperty('--bg', bg)
    document.documentElement.style.setProperty('--fg', conf.fg)
    try { localStorage.setItem('kh-bg', bg) } catch (e) {}
  }, [conf])

  // New config: fade out, restart the sequence, fade in
  useEffect(() => {
    if (!conf) return
    setOn(false)
    const t = setTimeout(() => { setIdx(0); setOn(true) }, FADE)
    return () => clearTimeout(t)
  }, [conf])

  // Playlist: after `seconds`, fade out and move on
  useEffect(() => {
    if (!item || !item.seconds || seq.length < 2) return
    const ms = FADE + item.seconds * 1000
    const t1 = setTimeout(() => setOn(false), ms)
    const t2 = setTimeout(() => { setIdx(i => i + 1); setOn(true) }, ms + FADE)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [idx, seq])

  if (!conf || !item) return null
  const Scene = SCENES[item.type]
  return (
    <>
      <div className={'scene' + (on ? ' on' : '')} key={idx + ':' + JSON.stringify(conf)}>
        {item.type === 'image' && conf.image
          ? <div className="image-scene fill"><img src={conf.image} alt="" style={{ objectFit: conf.fit || 'cover' }} /></div>
          : Scene && conf.mode !== 'black' ? <Scene cfg={conf} opts={item} /> : null}
      </div>
      {String(conf.guides) === 'true' && <Guides />}
      {q.get('debug') && <div id="status">{item.type} · v{conf.version || 0} · {live.current ? 'live' : 'file'} · {__BUILD__}</div>}
    </>
  )
}

function Guides () {
  return (
    <div id="guides">
      <i style={{ left: '50%', top: 0, bottom: 0, width: 3, marginLeft: -1 }} /><i style={{ top: '50%', left: 0, right: 0, height: 3, marginTop: -1 }} />
      <i style={{ left: 0, top: 0, right: 0, height: 6 }} /><i style={{ left: 0, bottom: 0, right: 0, height: 6 }} />
      <i style={{ left: 0, top: 0, bottom: 0, width: 6 }} /><i style={{ right: 0, top: 0, bottom: 0, width: 6 }} />
      <span>{innerWidth} × {innerHeight} · dpr {window.devicePixelRatio || 1}</span>
    </div>
  )
}
