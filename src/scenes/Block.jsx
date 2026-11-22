/* BLOCK — plays a HyperFrames block (https://github.com/heygen-com/hyperframes, Apache License 2.0) full screen.
   The block's own HTML lives in public/blocks/<name>/ (index.html = original 1920x1080, portrait.html = the same
   with the frame swapped to 1080x1920). Its variables come from the URL hash; ?play&loop runs its timeline on repeat. */
import React from 'react'

export const BLOCKS = {
  portal: { defaults: { title: 'KACHA', replacementPhrase: 'Only cup no cap', subtitle: 'CHINESE MILK TEA', accent: '#F5C518' } },
  glass: { defaults: { headline: 'Kacha Haus' } }
}

export default function Block ({ cfg, opts }) {
  const name = opts.type
  const vars = { ...BLOCKS[name].defaults, ...((cfg.blocks || {})[name] || {}) }
  const portrait = innerWidth < innerHeight
  const [w, h] = portrait ? [1080, 1920] : [1920, 1080]
  // the block draws at a fixed size; scale it to cover the screen (crops a sliver if the shape differs)
  const k = Math.max(innerWidth / w, innerHeight / h)
  const src = `blocks/${name}/${portrait ? 'portrait' : 'index'}.html?play&loop#${encodeURIComponent(JSON.stringify(vars))}`
  return (
    <div className="fill" style={{ background: '#000', overflow: 'hidden' }}>
      <iframe key={src} title={name} src={src} width={w} height={h} scrolling="no"
        style={{ border: 0, pointerEvents: 'none', position: 'absolute', left: '50%', top: '50%', width: w, height: h, transform: `translate(-50%, -50%) scale(${k})` }} />
    </div>
  )
}
