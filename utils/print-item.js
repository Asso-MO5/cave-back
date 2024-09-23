const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas')
const path = require('path')
const fs = require('fs')
const { getSlug } = require('./get-slug')
const { getTextFromBlock } = require('./get-text-from-block')
const QRCode = require('qrcode')
const { printCanvasText } = require('./print-canvas-text')
const { FRONT_URL, SIZES } = require('./constants')
const { getItemById } = require('../entities/items')
// en mm

GlobalFonts.registerFromPath(
  path.join(__dirname, '../data/fonts/Oswald/Oswald-VariableFont_wght.ttf'),
  'Oswald'
)

GlobalFonts.registerFromPath(
  path.join(
    __dirname,
    '../data/fonts/Open_Sans/OpenSans-VariableFont_wdth,wght.ttf'
  ),
  'OpenSans'
)

GlobalFonts.registerFromPath(
  path.join(
    __dirname,
    '../data/fonts/Open_Sans/OpenSans-Italic-VariableFont_wdth,wght.ttf'
  ),
  'OpenSansItalic'
)

const FONTS = {
  OpenSans: 'OpenSans',
  OpenSansItalic: 'OpenSansItalic',
  Oswald: 'Oswald',
}

async function printItem(item, _type = 'carte') {
  const type = _type.toLowerCase()
  if (!SIZES?.[type]?.width || item?.relations?.length === 0)
    throw new Error('Type de print inconnu')

  const size = SIZES[type]
  const DPI = 100 // Résolution en DPI
  const widthPixels = Math.round((size.width / 25.4) * DPI)
  const heightPixels = Math.round((size.height / 25.4) * DPI)
  const canvas = createCanvas(widthPixels, heightPixels)
  const ctx = canvas.getContext('2d')

  const itemSource = await getItemById(item.relations[0].id)
  // LE FOND
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, widthPixels, heightPixels)

  // Texte général
  ctx.font = `${size.fontSize}px Arial`
  ctx.fillStyle = 'black'
  let coord = {
    x: 0,
    y: 24,
  }

  // ------ [[ CARTE ]] -----------------------------------------------------------------------
  if (type === 'carte') {
    const margin = 15
    coord.x = margin
    const maxX = widthPixels - margin

    // TITRE
    coord = printCanvasText({
      ctx,
      ...coord,
      text: item.name,
      fontSize: 22,
      fontFamily: FONTS.Oswald,
      style: 'bold',
      lineHeight: 24,
      maxX,
    })

    // ==== SOUS-TITRE - Fabricant...

    const brand = itemSource.relations
      .filter((r) => r.relation_type.match(/manufacturer|publisher/))
      .map((r) => r.name)
      .join(' / ')

    coord = printCanvasText({
      ctx,
      y: coord.y + size.fontSize + 10,
      x: margin,
      text: brand.toUpperCase(),
      fontSize: 15,
      fontFamily: FONTS.OpenSans,
      style: 'normal',
      lineHeight: 15 * 1.5,
      maxX,
    })

    coord = printCanvasText({
      ctx,
      ...coord,
      text: ' - ',
      fontSize: 15,
      fontFamily: FONTS.OpenSans,
      style: 'normal',
      lineHeight: 15 * 1.5,
      maxX,
    })

    coord = printCanvasText({
      ctx,
      ...coord,
      text: item.var_release_fr,
      fontSize: 15,
      fontFamily: FONTS.OpenSans,
      style: 'normal',
      lineHeight: 15 * 1.5,
      maxX,
    })

    // ==== END SOUS-TITRE -

    coord.y = coord.y + 10
    ctx.beginPath() // Commence un nouveau chemin
    ctx.moveTo(margin, coord.y) // Position de départ
    ctx.lineTo(maxX, coord.y) // Position de fin
    ctx.stroke() // Dessine la ligne

    // DESCRIPTION
    coord = getTextFromBlock({
      blocks: item.long_short_description,
      ctx,
      y: coord.y + size.fontSize * 1.5 + 10,
      x: margin,
      maxX,
      fontSize: size.fontSize,
      fontFamily: FONTS.OpenSans,
    })

    // ===== FOOTER
    await QRCode.toFile(
      path.join(__dirname, '../uploads/qr/', `${item.id}.png`),
      `${FRONT_URL}/fiches/${item.id}`,
      {
        color: {
          dark: '#000',
          light: '#0000',
        },
        width: widthPixels - 10,

        type: 'svg',
      }
    )
    const qr = await loadImage(`uploads/qr/${item.id}.png`)

    ctx.drawImage(qr, 0, heightPixels - size.qrSize, size.qrSize, size.qrSize)

    ctx.font = `13px ${FONTS.OpenSansItalic}`

    const originField = item.var_origin || 'Collection association MO5'
    const xOriginField =
      widthPixels - ctx.measureText(originField).width - margin

    ctx.fillText(originField, xOriginField, heightPixels - margin)
  }

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
