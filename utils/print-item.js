const { createCanvas, loadImage } = require('@napi-rs/canvas')
const path = require('path')
const fs = require('fs')
const { getSlug } = require('./get-slug')
const { getTextFromBlock } = require('./get-text-from-block')
const QRCode = require('qrcode')
// en mm
const sizes = {
  A4: {
    width: 210,
    height: 297,
    fontSize: 13,
    qrSize: 50,
  },
  A5: {
    width: 148,
    height: 210,
    fontSize: 10,
    qrSize: 50,
  },
  carte: {
    width: 85,
    height: 55,
    fontSize: 10,
    qrSize: 50,
  },
  rollup: {
    width: 850,
    height: 2000,
    fontSize: 20,
    qrSize: 100,
  },
}

async function printItem(item, type) {
  if (!sizes?.[type]?.width) throw new Error('Type de print inconnu')

  const size = sizes[type]
  const DPI = 100 // Résolution en DPI
  const widthPixels = Math.round((size.width / 25.4) * DPI)
  const heightPixels = Math.round((size.height / 25.4) * DPI)
  const canvas = createCanvas(widthPixels, heightPixels)
  const ctx = canvas.getContext('2d')

  // LE FOND
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, widthPixels, heightPixels)

  // Texte général
  ctx.font = `${size.fontSize}px Arial`
  ctx.fillStyle = 'black'

  if (type === 'carte') {
    ctx.font = `bold ${size.fontSize * 1.5}px Arial`
    const margin = 10
    ctx.fillText(item.name.toUpperCase(), margin, size.fontSize + margin)
    getTextFromBlock({
      blocks: item.long_short_description,
      ctx,
      y: size.fontSize * 1.5 + margin * 2,
      x: 10,
      fontSize: size.fontSize,
      maxX: widthPixels - margin,
    })

    await QRCode.toFile(
      path.join(__dirname, '../uploads/qr/', `${item.id}.png`),
      `${item.id}`,
      {
        color: {
          dark: '#4088cf', // Blue dots
          light: '#0000',
        },
        width: widthPixels - 10,
      }
    )
    const qr = await loadImage(`uploads/qr/${item.id}.png`)

    ctx.drawImage(
      qr,
      widthPixels - size.qrSize - margin,
      heightPixels - size.qrSize - margin,
      size.qrSize,
      size.qrSize
    )
  }

  // Convertir le canvas en image et l'enregistrer
  const bufferPage = Buffer.from(
    canvas.toDataURL().replace('data:image/png;base64,', ''),
    'base64'
  )

  const uploadDir = path.join(__dirname, '../uploads/print')
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

  const name = getSlug(`${item.name}-${type}`)
  const tempImagePath = path.join(uploadDir, `${name}.png`)
  fs.writeFileSync(tempImagePath, bufferPage)

  return `uploads/print/${name}.png`
}

module.exports = { printItem }
