import { createCanvas } from 'canvas'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, 'public', 'icons')
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

function drawForgeIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const r = size * 0.18

  // Background: dark rounded rect
  ctx.fillStyle = '#0D0D0F'
  roundRect(ctx, 0, 0, size, size, r)
  ctx.fill()

  // Gradient fill for background circle
  const bg = ctx.createRadialGradient(size * 0.5, size * 0.4, 0, size * 0.5, size * 0.5, size * 0.55)
  bg.addColorStop(0, 'rgba(255,107,26,0.15)')
  bg.addColorStop(1, 'rgba(255,107,26,0)')
  ctx.fillStyle = bg
  roundRect(ctx, 0, 0, size, size, r)
  ctx.fill()

  // Draw "F" letter with forge style
  const cx = size * 0.5
  const cy = size * 0.5
  const fw = size * 0.28  // letter width
  const fh = size * 0.45  // letter height
  const lx = cx - fw * 0.5
  const ty = cy - fh * 0.5
  const sw = size * 0.1   // stroke width

  ctx.fillStyle = '#FF6B1A'

  // Vertical bar
  ctx.fillRect(lx, ty, sw, fh)

  // Top horizontal bar
  ctx.fillRect(lx, ty, fw, sw)

  // Middle horizontal bar (shorter)
  ctx.fillRect(lx, ty + fh * 0.45, fw * 0.7, sw)

  // Flame accent at top-right of F
  const flameGrad = ctx.createLinearGradient(lx + fw, ty - size * 0.06, lx + fw * 1.1, ty + size * 0.05)
  flameGrad.addColorStop(0, '#FFA052')
  flameGrad.addColorStop(1, '#FF6B1A')
  ctx.fillStyle = flameGrad
  ctx.beginPath()
  ctx.moveTo(lx + fw, ty + sw)
  ctx.lineTo(lx + fw + size * 0.06, ty - size * 0.04)
  ctx.lineTo(lx + fw + size * 0.04, ty + size * 0.04)
  ctx.closePath()
  ctx.fill()

  return canvas.toBuffer('image/png')
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

const sizes = [72, 96, 128, 144, 192, 512]
for (const size of sizes) {
  const buf = drawForgeIcon(size)
  writeFileSync(join(outDir, `icon-${size}.png`), buf)
  console.log(`✓ icon-${size}.png`)
}

// Also create favicon.ico (32px)
const favicon = drawForgeIcon(32)
writeFileSync(join(__dirname, 'public', 'favicon.ico'), favicon)
console.log('✓ favicon.ico')

// SVG icon for HTML
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="18" fill="#0D0D0F"/>
  <rect x="30" y="22" width="10" height="56" fill="#FF6B1A"/>
  <rect x="30" y="22" width="38" height="10" fill="#FF6B1A"/>
  <rect x="30" y="46" width="27" height="10" fill="#FF6B1A"/>
  <polygon points="68,22 76,14 74,24" fill="#FFA052"/>
</svg>`
writeFileSync(join(__dirname, 'public', 'forge-icon.svg'), svgContent)
console.log('✓ forge-icon.svg')
console.log('\nAll FORGE icons generated!')
