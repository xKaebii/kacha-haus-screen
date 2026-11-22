import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

const start = () => createRoot(document.getElementById('root')).render(<App />)
// Text is drawn in Higed everywhere (SVG, canvas, WebGL textures), so wait for it once
document.fonts.load('100px Higed').then(start, start)
