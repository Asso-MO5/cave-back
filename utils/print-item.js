const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas')
const path = require('path')
const fs = require('fs')
const { getSlug } = require('./get-slug')
const { getTextFromBlock } = require('./get-text-from-block')
const QRCode = require('qrcode')
const { printCanvasText } = require('./print-canvas-text')
const { FRONT_URL, SIZES } = require('./constants')
const { getItemById } = require('../entities/items')
const { getCompanyById } = require('../entities/company')
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
  const DPI = 300 // Changement de résolution à 300 DPI
  const scaleFactor = DPI / 100 // Facteur d'échelle pour ajuster les tailles
  const widthPixels = Math.round((size.width / 25.4) * DPI)
  const heightPixels = Math.round((size.height / 25.4) * DPI)
  const canvas = createCanvas(widthPixels, heightPixels)
  const ctx = canvas.getContext('2d')

  const itemSource = await getItemById(item.relations[0].id)

  // LE FOND
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, widthPixels, heightPixels)

  // Texte général
  ctx.font = `${size.fontSize * scaleFactor}px Arial` // Ajuster la taille de police
  ctx.fillStyle = 'black'
  let coord = {
    x: 0,
    y: 24 * scaleFactor, // Ajuster la position Y
  }

  // ------ [[ CARTE ]] -----------------------------------------------------------------------
  if (type === 'carte') {
    const margin = 15 * scaleFactor
    coord.x = margin
    const maxX = widthPixels - margin

    // TITRE
    coord = printCanvasText({
      ctx,
      ...coord,
      text: item.name,
      fontSize: 22 * scaleFactor, // Ajuster la taille de la police
      fontFamily: FONTS.Oswald,
      style: 'bold',
      lineHeight: 24 * scaleFactor, // Ajuster la hauteur de ligne
      maxX,
    })

    // ==== SOUS-TITRE - Fabricant...

    const brand = itemSource.relations
      .filter((r) => r.relation_type.match(/manufacturer|publisher/))
      .map((r) => r.name)
      .join(' / ')

    coord = printCanvasText({
      ctx,
      y: coord.y + size.fontSize * scaleFactor + 10 * scaleFactor, // Ajuster la position Y
      x: margin,
      text: brand.toUpperCase(),
      fontSize: 15 * scaleFactor, // Ajuster la taille de la police
      fontFamily: FONTS.OpenSans,
      style: 'normal',
      lineHeight: 15 * 1.5 * scaleFactor, // Ajuster la hauteur de ligne
      maxX,
    })

    coord = printCanvasText({
      ctx,
      ...coord,
      text: ' - ',
      fontSize: 15 * scaleFactor, // Ajuster la taille de la police
      fontFamily: FONTS.OpenSans,
      style: 'normal',
      lineHeight: 15 * 1.5 * scaleFactor, // Ajuster la hauteur de ligne
      maxX,
    })

    coord = printCanvasText({
      ctx,
      ...coord,
      text: item.var_release_fr,
      fontSize: 15 * scaleFactor, // Ajuster la taille de la police
      fontFamily: FONTS.OpenSans,
      style: 'normal',
      lineHeight: 15 * 1.5 * scaleFactor, // Ajuster la hauteur de ligne
      maxX,
    })

    // ==== END SOUS-TITRE -

    coord.y = coord.y + 10 * scaleFactor // Ajuster la position Y
    ctx.beginPath() // Commence un nouveau chemin
    ctx.moveTo(margin, coord.y) // Position de départ
    ctx.lineTo(maxX, coord.y) // Position de fin
    ctx.stroke() // Dessine la ligne

    // DESCRIPTION
    coord = getTextFromBlock({
      blocks: item.long_short_description,
      ctx,
      y: coord.y + size.fontSize * 1.5 * scaleFactor + 10 * scaleFactor, // Ajuster la position Y
      x: margin,
      maxX,
      fontSize: size.fontSize * scaleFactor, // Ajuster la taille de la police
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

    ctx.drawImage(
      qr,
      0,
      heightPixels - size.qrSize * scaleFactor,
      size.qrSize * scaleFactor,
      size.qrSize * scaleFactor
    )

    ctx.font = `${13 * scaleFactor}px ${FONTS.OpenSansItalic}`

    const originField = item.var_origin || 'Collection association MO5'
    const xOriginField =
      widthPixels - ctx.measureText(originField).width - margin

    ctx.fillText(originField, xOriginField, heightPixels - margin)
  }

  if (type === 'cartel machine') {
    const margin = 25 * scaleFactor
    coord.x = margin
    coord.y = margin + 100 * scaleFactor
    const maxX = widthPixels

    const _manufacturer = itemSource.relations.find((r) =>
      r.relation_type.match(/manufacturer|publisher/)
    )

    const logo = item.medias.find((m) => m.relation_type === 'cover')

    if (logo) {
      const img = await loadImage(logo.url.slice(1))
      // Taille de l'image
      const imgHeight = 300 * scaleFactor
      const imgWidth = img.width * (imgHeight / img.height)
      const imgX = widthPixels / 2 - imgWidth / 2
      ctx.drawImage(img, imgX, coord.y, imgWidth, imgHeight)
    }

    coord.y = coord.y + 300 * scaleFactor + 10 * scaleFactor

    if (_manufacturer) {
      const manufacturer = await getCompanyById(_manufacturer.id)
      const manufacturerLogo = manufacturer.medias.find(
        (m) => m.relation_type === 'cover'
      )

      if (manufacturerLogo) {
        const img = await loadImage(manufacturerLogo.url.slice(1))

        // à droite
        const imgHeight = 80 * scaleFactor
        const imgWidth = img.width * (imgHeight / img.height)
        const imgX = widthPixels - imgWidth - margin
        ctx.drawImage(img, imgX, coord.y, imgWidth, imgHeight)
      }

      coord.x = margin
      coord.y = coord.y + 80 * scaleFactor + 30 * scaleFactor
      // line
      ctx.fillStyle = 'black'
      ctx.beginPath()
      ctx.lineWidth = 10 * scaleFactor
      ctx.moveTo(margin, coord.y)
      ctx.lineTo(widthPixels - margin, coord.y)
      ctx.stroke()
    }

    // Nom machine - nom constructeur - année

    coord.x = margin
    coord.y = coord.y + 125 * scaleFactor

    coord = printCanvasText({
      ctx,
      ...coord,
      text: item.name,
      fontSize: 120 * scaleFactor,
      fontFamily: FONTS.Oswald,
      style: 'bold',
      lineHeight: 150 * scaleFactor,
      maxX,
    })

    coord.x = coord.x + 10 * scaleFactor

    coord.y = coord.y - 10 * scaleFactor

    coord = printCanvasText({
      ctx,
      ...coord,
      text: _manufacturer?.name || '',
      fontSize: 60 * scaleFactor,
      fontFamily: FONTS.Oswald,
      style: '',
      lineHeight: 150 * scaleFactor,
      maxX,
    })

    const euFlag = await loadImage('data/flags/eu.png')
    const usFlag = await loadImage('data/flags/us.png')
    const jpFlag = await loadImage('data/flags/jp.png')
    const ratio = euFlag.width / euFlag.height
    const flagWidth = 80 * scaleFactor
    const flagHeight = flagWidth / ratio
    coord.x = coord.x + 100 * scaleFactor
    coord.y = coord.y + 10 * scaleFactor

    const yflag = coord.y - 60 * scaleFactor
    const yText = coord.y - 10 * scaleFactor

    if (item.var_release_eu) {
      ctx.drawImage(euFlag, coord.x, yflag, flagWidth, flagHeight)
      coord.x = coord.x + flagWidth + 20 * scaleFactor
      coord = printCanvasText({
        ctx,
        x: coord.x,
        y: yText,
        text: item.var_release_eu || '',
        fontSize: 60 * scaleFactor,
        fontFamily: FONTS.Oswald,
        style: '',
        lineHeight: 150 * scaleFactor,
        maxX,
      })
    }
    if (item.var_release_us) {
      coord.x = coord.x + 50 * scaleFactor
      ctx.drawImage(usFlag, coord.x, yflag, flagWidth, flagHeight)
      coord.x = coord.x + flagWidth + 20 * scaleFactor
      coord = printCanvasText({
        ctx,
        x: coord.x,
        y: yText,
        text: item.var_release_us,
        fontSize: 60 * scaleFactor,
        fontFamily: FONTS.Oswald,
        style: '',
        lineHeight: 150 * scaleFactor,
        maxX,
      })
    }
    if (item.var_release_jap) {
      coord.x = coord.x + 50 * scaleFactor
      ctx.drawImage(jpFlag, coord.x, yflag, flagWidth, flagHeight)
      coord.x = coord.x + flagWidth + 20 * scaleFactor
      coord = printCanvasText({
        ctx,
        x: coord.x,
        y: yText,
        text: item.var_release_jap,
        fontSize: 60 * scaleFactor,
        fontFamily: FONTS.Oswald,
        style: '',
        lineHeight: 150 * scaleFactor,
        maxX,
      })
    }
    const yDesc = coord.y + 150 * scaleFactor

    coord.x = margin + 50 * scaleFactor
    coord = getTextFromBlock({
      ctx,
      x: coord.x,
      y: yDesc,
      blocks: item.long_description_fr,
      fontSize: 50 * scaleFactor,
      fontFamily: FONTS.OpenSans,
      lineHeight: 45 * scaleFactor,
      maxX: maxX / 2 - 50 * scaleFactor,
    })

    coord = getTextFromBlock({
      ctx,
      x: maxX / 2 + 50 * scaleFactor,
      y: yDesc,
      blocks: item.long_description_en,
      fontSize: 50 * scaleFactor,
      fontFamily: FONTS.OpenSans,
      lineHeight: 45 * scaleFactor,
      maxX: maxX - 50 * scaleFactor,
    })
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
