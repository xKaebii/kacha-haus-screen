/* VIDEO — a pre-rendered clip played full screen on a loop (muted, inline).
   For looks too heavy to run live on the shop's player: render them once to MP4 (e.g. the HyperFrames portal) and
   play the file instead. `video.src` is a path under public/ (videos/portal.mp4) or any https link. */
import React, { useEffect, useRef } from 'react'

export default function Video ({ cfg, opts }) {
  const ref = useRef(null)
  // a playlist entry may name its own file: { type: 'video', src: 'videos/x.mp4', seconds: 8 }
  const v = { src: 'videos/portal.mp4', fit: 'cover', ...(cfg.video || {}), ...(opts && opts.src ? { src: opts.src } : {}) }
  useEffect(() => {
    const el = ref.current
    const play = () => el.play().catch(() => {})
    play()
    // some players pause hidden/background media; nudge it back
    const t = setInterval(() => { if (el.paused) play() }, 3000)
    return () => clearInterval(t)
  }, [v.src])
  return (
    <div className="fill" style={{ background: '#000' }}>
      <video ref={ref} key={v.src} src={v.src} className="fill" style={{ objectFit: v.fit }} autoPlay muted loop playsInline preload="auto" />
    </div>
  )
}
