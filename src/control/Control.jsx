import React, { useEffect, useMemo, useRef, useState } from 'react'
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { app, watchConfig, saveConfig, ADMIN_EMAIL } from '../lib/firebase.js'
import { DEFAULT_ROWS } from '../lib/brand.js'

const auth = getAuth(app)
// dev only: ?demo shows the editor without signing in and never saves
const DEMO = import.meta.env.DEV && new URLSearchParams(location.search).has('demo')
// rendered clips in public/videos (portrait 1080x1920, loop)
const VIDEOS = [['videos/portal.mp4', 'Portal'], ['videos/portal-sentence.mp4', 'IF I WERE YOU'], ['videos/extruded-kacha.mp4', 'KACHA โครม'], ['videos/glass-hero.mp4', 'ABSOLUTELY DESIGNED'], ['videos/neon-laser.mp4', 'Neon Laser (Katana)'], ['videos/remix-white-mink.mp4', 'เสื้อขนสีขาว'], ['videos/remix-mink.mp4', 'เสื้อขนสีน้ำตาล'], ['videos/field-dance.mp4', 'เต้นทุ่งหญ้า']]
const SCENES = [
  { type: 'video', name: 'วิดีโอ (Portal)', sub: 'คลิปที่เรนเดอร์ไว้ เล่นวน เบาสุด', seconds: 16 },
  { type: 'portal', name: 'Portal Title', sub: 'ตัวอักษร 3D ทะลุประตูระเบิด (HyperFrames)', seconds: 16 },
  { type: 'glass', name: 'Glass Shards', sub: 'เศษกระจก 3D ประกอบเป็นคำ (HyperFrames)', seconds: 12 },
  { type: 'hyper', name: 'Hyper (HyperFrames)', sub: 'สไตล์โชว์จอ LED: คำกระแทก เหวี่ยง หมุน + เบลอ', seconds: 16 },
  { type: 'ramp', name: 'Speed Ramp', sub: 'คำพุ่งเข้า-ช้า-พุ่งออก + เบลอตามความเร็ว', seconds: 20 },
  { type: 'type', name: 'Type (GSAP)', sub: 'คำใหญ่ทีละคำ 15 ท่า + กำแพงคำหมุน', seconds: 60 },
  { type: 'kinetic', name: 'Kinetic 3D', sub: '4 รูปทรงหมุนต่อกัน (Codrops)', seconds: 30 },
  { type: 'endless', name: 'Kinetic · Endless', sub: 'ปมคำ', seconds: 15 },
  { type: 'swirl', name: 'Kinetic · Swirl', sub: 'ลูกบอลคำ', seconds: 15 },
  { type: 'twisted', name: 'Kinetic · Twisted', sub: 'แท่งคำบิด', seconds: 15 },
  { type: 'relax', name: 'Kinetic · Relax', sub: 'ผืนคำเป็นคลื่น', seconds: 15 },
  { type: 'led', name: 'ป้าย LED', sub: 'คำเฉียงวิ่ง + โลโก้', seconds: 30 },
  { type: 'stretch', name: 'Stretch Stack', sub: 'คำยืดเต็มจอทีละคำ', seconds: 16.5 },
  { type: 'tunnel', name: 'Tunnel Dive', sub: 'อุโมงค์คำ 3D', seconds: 15.5 },
  { type: 'beat', name: 'One Line, One Beat', sub: 'ประโยคทีละท่อน', seconds: 17.5 },
  { type: 'windows', name: 'Letters as Windows', sub: 'ตัวอักษรเป็นหน้าต่าง', seconds: 15 }
]
const NAME = Object.fromEntries(SCENES.map(s => [s.type, s.name]))
const PRESETS = [
  { name: 'กรมท่า / ขาว', bg: '#12131c', fg: '#f1f1f6' },
  { name: 'แก้ว', bg: '#15152a', fg: '#f4f4ff' },
  { name: 'กลับสี', bg: '#f1f1f6', fg: '#12131c' },
  { name: 'ดำ / ขาว', bg: '#000000', fg: '#ffffff' }
]
const getJSON = name => fetch(name + '?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json())

// Fill in anything the stored config is missing, so every control has a value
function normalise (c) {
  const scenes = Array.isArray(c.scenes) ? c.scenes.filter(s => s && NAME[s.type]) : []
  for (const s of SCENES) if (!scenes.find(x => x.type === s.type)) scenes.push({ type: s.type, seconds: s.seconds, off: true })
  return {
    mode: 'playlist', bg: '#12131c', fg: '#f1f1f6', angle: -48, size: 15, speed: 12, logo: true, logoX: 0, logoY: 0, logoSize: 50,
    rows: DEFAULT_ROWS, image: '', fit: 'cover', guides: false, ...c, scenes,
    stretch: { words: ['KACHA', 'HAUS', 'ONLY CUP', 'NO CAP', 'ABSOLUTELY', 'DESIGNED'], ...(c.stretch || {}) },
    beat: { lines: ['IF I', 'WERE / YOU', 'I WOULD', 'DRINK', 'MYSELF', 'TOO'], ...(c.beat || {}) },
    windows: { words: ['KACHA', 'HAUS'], ...(c.windows || {}) },
    video: { src: 'videos/portal.mp4', fit: 'cover', ...(c.video || {}) },
    blocks: { portal: { title: 'KACHA', replacementPhrase: 'Only cup no cap', subtitle: 'CHINESE MILK TEA', accent: '#F5C518', ...((c.blocks || {}).portal || {}) }, glass: { headline: 'Kacha Haus', ...((c.blocks || {}).glass || {}) } },
    hyper: { slamA: ['ONLY', '*CUP', 'NO', '*CAP', 'KACHA', '*HAUS'], shutter: 'KACHA', headline: 'MILK *TEA', explode: 'ABSOLUTELY', slamB: ['LOVE', 'YOU', '*CUP'], accent: '#FFD700', ...(c.hyper || {}) },
    ramp: { words: ['KACHA', 'HAUS', 'ONLY CUP', 'NO CAP', 'CHINESE', 'MILK TEA', 'ABSOLUTELY', 'DESIGNED'], font: 'higed', drift: 1.3, ...(c.ramp || {}) },
    type: { words: ['KACHA', 'HAUS', 'ONLY CUP', 'NO CAP', 'CHINESE', 'MILK TEA', 'ABSOLUTELY', 'DESIGNED', 'LOVE YOU', 'CUP'], font: 'higed', hold: 1.1, ...(c.type || {}) },
    kinetic: { words: ['KACHA', 'HAUS', 'NO CAP', 'ONLY CUP'], palette: 'original', font: 'higed', hold: 6, ...(c.kinetic || {}) }
  }
}

export default function Control () {
  const [user, setUser] = useState(undefined)
  const [cfg, setCfg] = useState(null)
  const [state, setState] = useState('')
  const dirty = useRef(false), timer = useRef(null), latest = useRef(null)

  useEffect(() => DEMO ? setUser({ email: ADMIN_EMAIL, emailVerified: true }) : onAuthStateChanged(auth, setUser), [])
  const allowed = user && user.email === ADMIN_EMAIL && user.emailVerified

  // Current settings: live copy from Firebase, or config.json the first time
  useEffect(() => {
    if (!allowed) return
    return watchConfig(v => {
      if (dirty.current) return                     // don't overwrite what is being typed
      if (v) { setCfg(normalise(v)); setState('') }
      else getJSON('config.json').then(c => setCfg(normalise(c)))
    }, e => setState('อ่านค่าไม่ได้: ' + e.message))
  }, [allowed])

  // Every change goes live after a short pause
  const update = patch => {
    setCfg(prev => {
      const next = { ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }
      latest.current = next; dirty.current = true
      clearTimeout(timer.current); setState('กำลังส่ง…')
      timer.current = setTimeout(() => {
        const out = { ...latest.current, version: (latest.current.version || 0) + 1, updatedAt: Date.now(), updatedBy: user.email }
        ;(DEMO ? Promise.resolve() : saveConfig(out)).then(() => { dirty.current = false; setCfg(c => ({ ...c, version: out.version })); setState('ขึ้นจอแล้ว ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })) },
          e => { dirty.current = false; setState('ส่งไม่สำเร็จ: ' + e.message) })
      }, 650)
      return next
    })
  }

  if (user === undefined) return <div className="c-wrap"><p className="c-muted">กำลังโหลด…</p></div>
  if (!user) return (
    <div className="c-wrap c-center">
      <h1 className="c-title">Kacha Haus<br /><span>จอในร้าน</span></h1>
      <button className="c-btn c-primary" onClick={() => signInWithPopup(auth, new GoogleAuthProvider().setCustomParameters({ prompt: 'select_account' })).catch(e => alert(e.message))}>เข้าสู่ระบบด้วย Google</button>
      <p className="c-muted">ใช้บัญชี Google ของร้าน</p>
    </div>
  )
  if (!allowed) return (
    <div className="c-wrap c-center">
      <p>บัญชี {user.email} แก้จอไม่ได้</p>
      <p className="c-muted">ต้องใช้บัญชี Google ของร้าน</p>
      <button className="c-btn" onClick={() => signOut(auth)}>ออกจากระบบ / เปลี่ยนบัญชี</button>
    </div>
  )
  if (!cfg) return <div className="c-wrap"><p className="c-muted">กำลังโหลดค่าจอ…</p></div>

  const setScene = (i, patch) => update(p => ({ scenes: p.scenes.map((s, k) => k === i ? { ...s, ...patch } : s) }))
  const move = (i, d) => update(p => { const a = [...p.scenes], j = i + d; if (j < 0 || j >= a.length) return {}; [a[i], a[j]] = [a[j], a[i]]; return { scenes: a } })
  const lines = v => v.split('\n').map(s => s.trim()).filter(Boolean)

  return (
    <div className="c-wrap">
      <header className="c-head">
        <div><b>Kacha Haus</b> · จอในร้าน</div>
        <button className="c-link" onClick={() => signOut(auth)}>ออก</button>
      </header>
      <div className={'c-state' + (state.startsWith('ส่งไม่') || state.startsWith('อ่าน') ? ' err' : '')}>{state || 'พร้อม · แก้แล้วขึ้นจอทันที'}</div>

      <section className="c-card c-preview">
        <iframe title="preview" src="./?preview=1" />
        <div>
          <p className="c-muted">จอจำลอง (เหมือนจอจริง)</p>
          <p className="c-big">{cfg.mode === 'playlist' ? 'เพลย์ลิสต์' : cfg.mode === 'image' ? 'รูป' : cfg.mode === 'black' ? 'จอดำ' : NAME[cfg.mode] || cfg.mode}</p>
          <p className="c-muted">v{cfg.version || 0}</p>
        </div>
      </section>

      <section className="c-card">
        <h2>ขึ้นจออะไร</h2>
        <div className="c-seg">
          {[['playlist', 'เพลย์ลิสต์'], ['scene', 'ฉากเดียว'], ['image', 'รูป'], ['black', 'จอดำ']].map(([k, l]) => {
            const on = k === 'scene' ? !!NAME[cfg.mode] : cfg.mode === k
            return <button key={k} className={on ? 'on' : ''} onClick={() => update({ mode: k === 'scene' ? (NAME[cfg.mode] ? cfg.mode : 'led') : k })}>{l}</button>
          })}
        </div>
        {NAME[cfg.mode] && (
          <div className="c-chips">
            {SCENES.map(s => <button key={s.type} className={cfg.mode === s.type ? 'on' : ''} onClick={() => update({ mode: s.type })}>{s.name}</button>)}
          </div>
        )}
        {cfg.mode === 'playlist' && (
          <ul className="c-list">
            {cfg.scenes.map((s, i) => (
              <li key={i} className={s.off ? 'off' : ''}>
                <label className="c-switch"><input type="checkbox" checked={!s.off} onChange={e => setScene(i, { off: !e.target.checked })} /><span /></label>
                <div className="c-grow"><b>{NAME[s.type]}</b><small>{s.type === 'video' && s.src ? s.src.replace(/^.*\//, '') : SCENES.find(x => x.type === s.type).sub}</small></div>
                <input className="c-num" type="number" min="5" max="600" step="0.5" value={s.seconds} onChange={e => setScene(i, { seconds: +e.target.value || 10 })} /><small>วิ</small>
                <button className="c-ico" onClick={() => move(i, -1)} aria-label="ขึ้น">↑</button>
                <button className="c-ico" onClick={() => move(i, 1)} aria-label="ลง">↓</button>
              </li>
            ))}
          </ul>
        )}
        {cfg.mode === 'image' && (
          <>
            <label className="c-field">ลิงก์รูป<input value={cfg.image} placeholder="https://…" onChange={e => update({ image: e.target.value.trim() })} /></label>
            <div className="c-seg">{[['cover', 'เต็มจอ'], ['contain', 'เห็นทั้งรูป']].map(([k, l]) => <button key={k} className={cfg.fit === k ? 'on' : ''} onClick={() => update({ fit: k })}>{l}</button>)}</div>
          </>
        )}
      </section>

      <section className="c-card">
        <h2>วิดีโอ</h2>
        <div className="c-seg">{VIDEOS.map(([src, l]) => <button key={src} className={cfg.video.src === src ? 'on' : ''} onClick={() => update(p => ({ video: { ...p.video, src } }))}>{l}</button>)}</div>
        <label className="c-field">ไฟล์วิดีโอ (path ใน repo หรือลิงก์ https)<input value={cfg.video.src} onChange={e => { const src = e.target.value.trim(); update(p => ({ video: { ...p.video, src } })) }} /></label>
        <div className="c-seg">{[['cover', 'เต็มจอ'], ['contain', 'เห็นทั้งคลิป']].map(([k, l]) => <button key={k} className={cfg.video.fit === k ? 'on' : ''} onClick={() => update(p => ({ video: { ...p.video, fit: k } }))}>{l}</button>)}</div>
      </section>

      <section className="c-card">
        <h2>Portal Title · Glass Shards <small>(3D หนัก ดูว่าจอไหวไหม)</small></h2>
        <div className="c-row2">
          <label className="c-field">Portal คำแรก (≤18)<input defaultValue={cfg.blocks.portal.title} maxLength={18} onChange={e => update(p => ({ blocks: { ...p.blocks, portal: { ...p.blocks.portal, title: e.target.value.toUpperCase() } } }))} /></label>
          <label className="c-field">Portal คำที่สลับเข้า<input defaultValue={cfg.blocks.portal.replacementPhrase} onChange={e => update(p => ({ blocks: { ...p.blocks, portal: { ...p.blocks.portal, replacementPhrase: e.target.value } } }))} /></label>
          <label className="c-field">Portal บรรทัดล่าง<input defaultValue={cfg.blocks.portal.subtitle} onChange={e => update(p => ({ blocks: { ...p.blocks, portal: { ...p.blocks.portal, subtitle: e.target.value.toUpperCase() } } }))} /></label>
          <label className="c-field">Portal สีเน้น<input type="color" value={cfg.blocks.portal.accent} onChange={e => update(p => ({ blocks: { ...p.blocks, portal: { ...p.blocks.portal, accent: e.target.value } } }))} /></label>
          <label className="c-field">Glass คำ (≤40)<input defaultValue={cfg.blocks.glass.headline} maxLength={40} onChange={e => update(p => ({ blocks: { ...p.blocks, glass: { headline: e.target.value } } }))} /></label>
        </div>
      </section>

      <section className="c-card">
        <h2>Hyper <small>(ใส่ * หน้าคำ = สีเน้น)</small></h2>
        <label className="c-field">ชุดคำกระแทก 1 · หนึ่งบรรทัด = หนึ่งคำ
          <textarea rows="4" defaultValue={cfg.hyper.slamA.join('\n')} onChange={e => update(p => ({ hyper: { ...p.hyper, slamA: lines(e.target.value.toUpperCase()) } }))} />
        </label>
        <div className="c-row2">
          <label className="c-field">คำเหวี่ยง-หมุน<input defaultValue={cfg.hyper.shutter} onChange={e => update(p => ({ hyper: { ...p.hyper, shutter: e.target.value.toUpperCase() } }))} /></label>
          <label className="c-field">หัวข้อกระแทก<input defaultValue={cfg.hyper.headline} onChange={e => update(p => ({ hyper: { ...p.hyper, headline: e.target.value.toUpperCase() } }))} /></label>
          <label className="c-field">คำแตกแล้วรวม<input defaultValue={cfg.hyper.explode} onChange={e => update(p => ({ hyper: { ...p.hyper, explode: e.target.value.toUpperCase() } }))} /></label>
          <label className="c-field">สีเน้น<input type="color" value={cfg.hyper.accent} onChange={e => update(p => ({ hyper: { ...p.hyper, accent: e.target.value } }))} /></label>
        </div>
        <label className="c-field">ชุดคำกระแทก 2
          <textarea rows="3" defaultValue={cfg.hyper.slamB.join('\n')} onChange={e => update(p => ({ hyper: { ...p.hyper, slamB: lines(e.target.value.toUpperCase()) } }))} />
        </label>
      </section>

      <section className="c-card">
        <h2>Speed Ramp</h2>
        <label className="c-field">คำ · หนึ่งบรรทัด = หนึ่งคำ (จบด้วยโลโก้)
          <textarea rows="6" defaultValue={cfg.ramp.words.join('\n')} onChange={e => update(p => ({ ramp: { ...p.ramp, words: lines(e.target.value.toUpperCase()) } }))} />
        </label>
        <div className="c-seg">{[['archivo', 'Archivo Black'], ['higed', 'Higed']].map(([k, l]) => <button key={k} className={cfg.ramp.font === k ? 'on' : ''} onClick={() => update(p => ({ ramp: { ...p.ramp, font: k } }))}>{l}</button>)}</div>
        <Slider label="ช่วงช้า (อ่านทัน)" v={cfg.ramp.drift} min={0.4} max={3} step={0.1} unit=" วิ" on={v => update(p => ({ ramp: { ...p.ramp, drift: v } }))} />
      </section>

      <section className="c-card">
        <h2>Type (GSAP)</h2>
        <label className="c-field">คำ · หนึ่งบรรทัด = หนึ่งจังหวะ
          <textarea rows="6" defaultValue={cfg.type.words.join('\n')} onChange={e => update(p => ({ type: { ...p.type, words: lines(e.target.value.toUpperCase()) } }))} />
        </label>
        <div className="c-seg">{[['archivo', 'Archivo Black'], ['higed', 'Higed']].map(([k, l]) => <button key={k} className={cfg.type.font === k ? 'on' : ''} onClick={() => update(p => ({ type: { ...p.type, font: k } }))}>{l}</button>)}</div>
        <Slider label="ค้างแต่ละคำ" v={cfg.type.hold} min={0.4} max={4} step={0.1} unit=" วิ" on={v => update(p => ({ type: { ...p.type, hold: v } }))} />
      </section>

      <section className="c-card">
        <h2>Kinetic 3D</h2>
        <div className="c-row2">
          {['Endless (ปม)', 'Swirl (ลูกบอล)', 'Twisted (แท่ง)', 'Relax (ผืน)'].map((l, i) => (
            <label key={i} className="c-field">{l}<input defaultValue={cfg.kinetic.words[i]} onChange={e => update(p => { const w = [...p.kinetic.words]; w[i] = e.target.value.toUpperCase(); return { kinetic: { ...p.kinetic, words: w } } })} /></label>
          ))}
        </div>
        <div className="c-seg">{[['original', 'สีต้นฉบับ'], ['brand', 'สีร้าน']].map(([k, l]) => <button key={k} className={cfg.kinetic.palette === k ? 'on' : ''} onClick={() => update(p => ({ kinetic: { ...p.kinetic, palette: k } }))}>{l}</button>)}</div>
        <div className="c-seg">{[['original', 'ฟอนต์ต้นฉบับ'], ['higed', 'ฟอนต์ Higed']].map(([k, l]) => <button key={k} className={cfg.kinetic.font === k ? 'on' : ''} onClick={() => update(p => ({ kinetic: { ...p.kinetic, font: k } }))}>{l}</button>)}</div>
        <Slider label="ค้างแต่ละรูปทรง" v={cfg.kinetic.hold} min={2} max={20} step={0.5} unit=" วิ" on={v => update(p => ({ kinetic: { ...p.kinetic, hold: v } }))} />
      </section>

      <section className="c-card">
        <h2>สี <small>(ป้าย LED และฉากอื่น)</small></h2>
        <div className="c-chips">{PRESETS.map(p => (
          <button key={p.name} className={cfg.bg === p.bg && cfg.fg === p.fg ? 'on' : ''} onClick={() => update({ bg: p.bg, fg: p.fg })}>
            <i style={{ background: p.bg, borderColor: p.fg }} />{p.name}
          </button>))}
        </div>
        <div className="c-row2">
          <label className="c-field">พื้น<input type="color" value={cfg.bg} onChange={e => update({ bg: e.target.value })} /></label>
          <label className="c-field">ตัวอักษร<input type="color" value={cfg.fg} onChange={e => update({ fg: e.target.value })} /></label>
        </div>
      </section>

      <section className="c-card">
        <h2>ป้าย LED <small>(ใช้กับ Tunnel / Windows ด้วย)</small></h2>
        <label className="c-field">คำ · หนึ่งบรรทัด = หนึ่งแถว · ใส่ * หน้าคำ = ตัวทึบ
          <textarea rows="7" defaultValue={cfg.rows.join('\n')} onChange={e => update({ rows: lines(e.target.value.toUpperCase()) })} />
        </label>
        <Slider label="มุมเอียง" v={cfg.angle} min={-90} max={90} step={1} unit="°" on={v => update({ angle: v })} />
        <Slider label="ขนาดตัว" v={cfg.size} min={6} max={30} step={0.5} on={v => update({ size: v })} />
        <Slider label="ความเร็ว" v={cfg.speed} min={2} max={40} step={1} on={v => update({ speed: v })} />
        <label className="c-check"><input type="checkbox" checked={String(cfg.logo) !== 'false'} onChange={e => update({ logo: e.target.checked })} /> โลโก้กลางจอ</label>
        {String(cfg.logo) !== 'false' && <div className="c-seg">{[['solid', 'โลโก้ทึบ'], ['glass', 'Liquid glass']].map(([k, l]) => <button key={k} className={(cfg.logoStyle || 'solid') === k ? 'on' : ''} onClick={() => update({ logoStyle: k })}>{l}</button>)}</div>}
        {String(cfg.logo) !== 'false' && <>
          <Slider label="โลโก้ ซ้าย-ขวา" v={cfg.logoX} min={-30} max={30} step={0.5} on={v => update({ logoX: v })} />
          <Slider label="โลโก้ ขึ้น-ลง" v={cfg.logoY} min={-30} max={30} step={0.5} on={v => update({ logoY: v })} />
          <Slider label="ขนาดโลโก้" v={cfg.logoSize} min={20} max={90} step={1} on={v => update({ logoSize: v })} />
        </>}
      </section>

      <section className="c-card">
        <h2>คำในฉากอื่น</h2>
        <label className="c-field">Stretch Stack · หนึ่งบรรทัด = หนึ่งแถว
          <textarea rows="6" defaultValue={cfg.stretch.words.join('\n')} onChange={e => update(p => ({ stretch: { ...p.stretch, words: lines(e.target.value.toUpperCase()) } }))} />
        </label>
        <label className="c-field">One Line, One Beat · หนึ่งบรรทัด = หนึ่งจังหวะ · ใช้ / แบ่งแถว · บรรทัดสุดท้ายถูกเติมนม
          <textarea rows="6" defaultValue={cfg.beat.lines.join('\n')} onChange={e => update(p => ({ beat: { ...p.beat, lines: lines(e.target.value.toUpperCase()) } }))} />
        </label>
        <div className="c-row2">
          <label className="c-field">Windows คำบน<input defaultValue={cfg.windows.words[0]} onChange={e => update(p => ({ windows: { words: [e.target.value.toUpperCase(), p.windows.words[1]] } }))} /></label>
          <label className="c-field">คำล่าง<input defaultValue={cfg.windows.words[1]} onChange={e => update(p => ({ windows: { words: [p.windows.words[0], e.target.value.toUpperCase()] } }))} /></label>
        </div>
      </section>

      <section className="c-card">
        <h2>อื่นๆ</h2>
        <label className="c-check"><input type="checkbox" checked={String(cfg.guides) === 'true'} onChange={e => update({ guides: e.target.checked })} /> เส้นช่วยวัดกลางจอ</label>
        <button className="c-btn" onClick={() => { if (confirm('โหลดค่าเริ่มต้นจากไฟล์ config.json แล้วส่งขึ้นจอ?')) getJSON('config.json').then(c => { const n = normalise(c); setCfg(n); update(n) }) }}>รีเซ็ตเป็นค่าเริ่มต้น</button>
        <p className="c-muted">เข้าสู่ระบบเป็น {user.email}</p>
      </section>
    </div>
  )
}

function Slider ({ label, v, min, max, step, unit = '', on }) {
  return (
    <label className="c-slider">
      <span>{label}<b>{v}{unit}</b></span>
      <input type="range" min={min} max={max} step={step} value={v} onChange={e => on(+e.target.value)} />
    </label>
  )
}
