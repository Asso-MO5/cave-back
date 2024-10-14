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
const sharp = require('sharp')
const { translateTypeFr } = require('./translate-type')
// en mm

GlobalFonts.registerFromPath(
  path.join(__dirname, '../data/fonts/Oswald/Oswald-VariableFont_wght.ttf'),
  'Oswald'
)

GlobalFonts.registerFromPath(
  path.join(__dirname, '../data/fonts/Oswald/static/Oswald-Bold.ttf'),
  'OswaldBold'
)

GlobalFonts.registerFromPath(
  path.join(__dirname, '../data/fonts/Lato/Lato-Regular.ttf'),
  'Lato'
)

GlobalFonts.registerFromPath(
  path.join(__dirname, '../data/fonts/Lato/Lato-Italic.ttf'),
  'LatoItalic'
)

const FONTS = {
  Lato: 'Lato',
  LatoItalic: 'LatoItalic',
  Oswald: 'Oswald',
  OswaldBold: 'OswaldBold',
}

async function printItem(item, _type = 'carte') {
  const type = _type.toLowerCase()
  if (!SIZES?.[type]?.width || item?.relations?.length === 0)
    throw new Error('Type de print inconnu')

  const size = SIZES[type]
  const DPI = 300
  const scaleFactor = DPI / 100 // Ajuster l'échelle pour le DPI
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
    x: 10,
    y: 30 * scaleFactor, // Ajuster la position Y
  }

  // ------ [[ CARTE ]] -----------------------------------------------------------------------
  if (type === 'carte') {
    const margin = 11 * scaleFactor
    coord.x = margin
    const maxX = widthPixels - margin

    ctx.letterSpacing = '-2px'
    // TITRE
    coord = printCanvasText({
      ctx,
      ...coord,
      text: item.name,
      fontSize: 23 * scaleFactor, // Ajuster la taille de la police
      fontFamily: FONTS.Oswald,
      style: 'bold',
      lineHeight: 24 * scaleFactor, // Ajuster la hauteur de ligne
      maxX,
    })

    ctx.letterSpacing = '0px'
    // ==== SOUS-TITRE - Fabricant...

    const brand = itemSource.relations
      .filter((r) => r.relation_type.match(/manufacturer|publisher/))
      .map((r) => r.name)
      .join(' / ')

    const fontSizeSubtitle = 16 * scaleFactor
    coord = printCanvasText({
      ctx,
      y: coord.y + size.fontSize * scaleFactor + 22 * scaleFactor,
      x: margin,
      text: brand.toUpperCase(),
      fontSize: fontSizeSubtitle,
      fontFamily: FONTS.Lato,
      style: 'normal',
      lineHeight: 15 * 1.5 * scaleFactor,
      maxX,
    })

    coord = printCanvasText({
      ctx,
      ...coord,
      text: ' – ',
      fontSize: fontSizeSubtitle,
      fontFamily: FONTS.Lato,
      style: 'normal',
      lineHeight: 15 * 1.5 * scaleFactor,
      maxX,
    })

    coord = printCanvasText({
      ctx,
      ...coord,
      text: item.var_release_fr,
      fontSize: fontSizeSubtitle,
      fontFamily: FONTS.Lato,
      style: 'normal',
      lineHeight: 15 * 1.5 * scaleFactor,
      maxX,
    })

    // ==== END SOUS-TITRE -

    // LIGNE
    coord.y = coord.y + 10 * scaleFactor

    ctx.beginPath()
    ctx.moveTo(margin, coord.y)
    ctx.lineTo(maxX, coord.y)
    ctx.stroke()

    const descIsEmpy =
      !item.long_short_description ||
      item.long_short_description.filter((b) => b.content.length > 0).length ===
        0

    // DESCRIPTION
    coord = getTextFromBlock({
      blocks: descIsEmpy
        ? item.long_description_fr
        : item.long_short_description,
      ctx,
      y: coord.y + size.fontSize * 1.6 * scaleFactor + 10,
      x: margin,
      maxX,
      fontSize: size.fontSize * scaleFactor,
      lineHeight: size.fontSize * 1.35 * scaleFactor,
      fontFamily: FONTS.Lato,
      maxChars: descIsEmpy ? 150 : Infinity,
    })

    // ===== FOOTER

    // ----- QR CODE -----
    if (item.medias.filter((m) => m.type === 'youtube-video').length > 0) {
      const link = item.medias.find((m) => m.type === 'youtube-video').url
      await QRCode.toFile(
        path.join(__dirname, '../uploads/qr/', `${item.id}.png`),
        link || `${FRONT_URL}fiches/${item.id}`,
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
        maxX - size.qrSize * 2 - margin,
        margin / 2,
        size.qrSize * scaleFactor,
        size.qrSize * scaleFactor
      )
    }
    // ----- END QR CODE -----

    ctx.font = `${size.fontSize * scaleFactor}px ${FONTS.LatoItalic}`

    const originField = item.var_origin || 'Collection association MO5'
    const xOriginField =
      widthPixels - ctx.measureText(originField).width - margin

    ctx.fillText(originField, xOriginField, heightPixels - margin)
  }

  if (type === 'cartel') {
    const margin = 100 * scaleFactor
    coord.x = margin
    coord.y = margin + 100 * scaleFactor
    const maxX = widthPixels

    const _manufacturer = itemSource.relations.find((r) =>
      r.relation_type.match(/manufacturer|publisher/)
    )

    const logo = item.medias.find((m) => m.relation_type === 'cover')

    let imgHeight = 420 * scaleFactor
    if (logo) {
      let img
      try {
        // Vérifier si le fichier est un SVG
        if (logo.url.endsWith('.svg')) {
          // Charger et convertir le SVG en PNG avec sharp
          const svgBuffer = fs.readFileSync(logo.url.slice(1))
          const pngBuffer = await sharp(svgBuffer).png().toBuffer()

          // Charger l'image convertie en PNG dans le canvas
          img = await loadImage(pngBuffer)
        } else {
          // Charger directement l'image si ce n'est pas un SVG
          img = await loadImage(logo.url.slice(1))
        }
      } catch (e) {
        console.error("Erreur lors du chargement de l'image", e)
      }

      if (img) {
        // Taille maximale de l'image en largeur (80% de la largeur totale)
        const maxImgWidth = widthPixels * 0.8

        // Taille de l'image avec une hauteur fixe
        let imgWidth = img.width * (imgHeight / img.height)

        // Vérifier si l'image dépasse la largeur maximale, et si oui, ajuster les dimensions
        if (imgWidth > maxImgWidth) {
          imgWidth = maxImgWidth
          imgHeight = img.height * (imgWidth / img.width) // Ajuster la hauteur proportionnellement
        }

        // Centrer l'image
        const imgX = (widthPixels - imgWidth) / 2

        // Dessiner l'image sur le canvas
        ctx.drawImage(img, imgX, coord.y, imgWidth, imgHeight)
      }
    }

    coord.y = coord.y + imgHeight + 10 * scaleFactor

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

    ctx.font = `${60 * scaleFactor}px ${FONTS.Oswald}`
    let currentX = widthPixels - margin

    const dates = ['jap', 'us', 'eu']

    for (lang of dates) {
      const text = item[`var_release_${lang}`]?.trim()
      if (!text) continue
      const flag = await loadImage(`data/flags/${lang}.png`)
      const ratio = flag.width / flag.height
      const flagWidth = 80 * scaleFactor
      const flagHeight = flagWidth / ratio
      const flagDecalage = 20 * scaleFactor + flagWidth
      const yflag = coord.y - 50 * scaleFactor
      const textDecalage = 80 * scaleFactor

      currentX -= ctx.measureText(text).width
      ctx.fillText(text, currentX, coord.y)
      currentX -= flagDecalage
      ctx.drawImage(flag, currentX, yflag, flagWidth, flagHeight)
      currentX -= textDecalage
    }

    // ----- MANUFACTURER NAME -----

    coord.x = margin
    coord.y = coord.y + 100 * scaleFactor

    const lineHeight = 60 * 1.5 * scaleFactor

    coord = printCanvasText({
      ctx,
      ...coord,
      text: _manufacturer?.name || '',
      fontSize: 60 * scaleFactor,
      fontFamily: FONTS.Oswald,
      style: '',
      lineHeight,
      maxX,
    })

    const yDesc = coord.y + 180 * scaleFactor

    coord.x = margin + 50 * scaleFactor

    coord = getTextFromBlock({
      ctx,
      x: coord.x + 50 * scaleFactor,
      y: yDesc,
      blocks: item.long_description_fr,
      fontSize: 50 * scaleFactor,
      fontFamily: FONTS.Lato,
      lineHeight,
      maxX: maxX / 2 - 100 * scaleFactor,
    })

    coord = getTextFromBlock({
      ctx,
      x: maxX / 2 + 100 * scaleFactor,
      y: yDesc,
      blocks: item.long_description_en,
      fontSize: 50 * scaleFactor,
      fontFamily: FONTS.LatoItalic,
      lineHeight,
      maxX: maxX - margin - 100 * scaleFactor,
    })
  }
  // -------- [[ END CARTE ]] -----------------------------------------------------------------------

  // -------- [[ BEGING A3 PAYSAGE ]] -----------------------------------------------------------------------
  if (type === 'a3 paysage') {
    const margin = 30 * scaleFactor
    coord.x = margin
    coord.y = margin
    const maxX = widthPixels

    coord.x = margin
    coord.y = coord.y + 50 * scaleFactor

    coord = printCanvasText({
      ctx,
      ...coord,
      text: item.name,
      fontSize: 55 * scaleFactor,
      fontFamily: FONTS.Oswald,
      style: 'bold',
      lineHeight: 50 * scaleFactor,
      maxX,
    })

    // ----- CONST -----

    coord.x = margin

    const descFontSize = 78
    const lineHeight = descFontSize * 1.5
    const goutiere = margin

    const sectionWidth = (maxX - goutiere * 2) / 2.5
    const yDesc = coord.y + 60 * scaleFactor
    coord.y = yDesc - 10 * scaleFactor
    const xMaxBlockDetailsEnd = widthPixels / 4
    const txtblockSize =
      (widthPixels - (xMaxBlockDetailsEnd + goutiere * 2)) / 2

    coord.x = sectionWidth

    let img
    let orientation = 'portrait'
    const fields = ['publisher', 'developer']
    const dates = ['jap', 'us', 'eu']
    const cover = item.medias.find((m) => m.relation_type === 'cover')
    const machine = itemSource.relations.find((it) => it.type === 'machine')

    if (cover) {
      try {
        if (cover.url.endsWith('.svg')) {
          const svgBuffer = fs.readFileSync(cover.url.slice(1))
          const pngBuffer = await sharp(svgBuffer).png().toBuffer()

          img = await loadImage(pngBuffer)
        } else {
          img = await loadImage(cover.url.slice(1))
        }
      } catch (e) {
        console.error("Erreur lors du chargement de l'image", e)
      }

      if (img) {
        const isPortrait = img.height > img.width
        orientation = isPortrait ? 'portrait' : 'landscape'
      }
    }

    if (orientation === 'portrait') {
      if (img) {
        let imgWidth = xMaxBlockDetailsEnd - goutiere * 2
        let imgHeight = img.height * (imgWidth / img.width)

        console.log(imgHeight)
        if (imgHeight > 1600) {
          imgHeight = 1600
          imgWidth = img.width * (imgHeight / img.height)
        }

        ctx.drawImage(
          img,
          (xMaxBlockDetailsEnd - goutiere * 2 - imgWidth) / 2,
          coord.y,
          imgWidth,
          imgHeight
        )
        coord.y = coord.y + imgHeight + 25 * scaleFactor
      }

      const fontSize = 30 * scaleFactor
      ctx.font = `${fontSize}px ${FONTS.Oswald}`

      if (machine) {
        coord.y += 10 * scaleFactor
        ctx.font = `${fontSize}px ${FONTS.OswaldBold}`

        const textSize = ctx.measureText(machine.name).width

        ctx.fillText(
          machine.name,
          (xMaxBlockDetailsEnd - textSize) / 2,
          coord.y
        )
        coord.y += fontSize
        ctx.font = `${fontSize}px ${FONTS.Oswald}`
      }

      for (const lang of dates) {
        const text = (item[`var_release_${lang}`] || '').trim()
        if (!text) continue
        const flag = await loadImage(`data/flags/${lang}.png`)
        const ratio = flag.width / flag.height
        const flagWidth = 50 * scaleFactor
        const flagHeight = flagWidth / ratio
        const textDecalage = margin + flagWidth + 20 * scaleFactor
        ctx.drawImage(flag, margin, coord.y, flagWidth, flagHeight)
        ctx.fillText(
          text,
          textDecalage,
          coord.y + flagHeight / 2 + fontSize / 2
        )
        coord.y += flagHeight + fontSize * 0.85
      }

      coord.y += 5 * scaleFactor

      for (const field of fields) {
        const company = itemSource.relations.find(
          (r) => r.relation_type === field
        )
        if (!company) continue

        coord.y += 30 * scaleFactor
        ctx.font = `${fontSize}px ${FONTS.OswaldBold}`

        ctx.fillText(translateTypeFr(field), margin, coord.y)
        coord.y += fontSize * 1.3

        ctx.font = `${fontSize}px ${FONTS.Oswald}`

        ctx.fillText(company.name, margin, coord.y)
        coord.y += fontSize
      }

      // ===================== BLOCK FR
      coord = getTextFromBlock({
        ctx,
        x: xMaxBlockDetailsEnd,
        y: yDesc,
        blocks: item.long_description_fr,
        fontSize: descFontSize,
        fontFamily: FONTS.Lato,
        lineHeight,
        maxX: xMaxBlockDetailsEnd + txtblockSize,
      })

      // ===================== ENG

      coord = getTextFromBlock({
        ctx,
        x: xMaxBlockDetailsEnd + goutiere + txtblockSize,
        y: yDesc,
        blocks: item.long_description_en,
        fontSize: descFontSize,
        fontFamily: FONTS.LatoItalic,
        lineHeight,
        maxX: maxX - margin,
      })
    }

    // ==== LANDSCAPE ====
    else if (orientation === 'landscape') {
      const sizeFirstBlock = heightPixels / 2.5

      let firstBlockY = coord.y - 20 * scaleFactor
      let firstBlockX = margin
      if (img) {
        const imgHeight = sizeFirstBlock - goutiere - coord.y
        const imgWidth = img.width * (imgHeight / img.height)
        ctx.drawImage(img, margin, firstBlockY, imgWidth, imgHeight)
        firstBlockY += imgHeight + goutiere
        firstBlockX += imgWidth
      }

      const fontSize = 30 * scaleFactor
      ctx.font = `${fontSize}px ${FONTS.Oswald}`
      const flagBlockX = firstBlockX + goutiere
      let fieldBlockX = flagBlockX + goutiere

      if (machine) {
        coord.y += 10 * scaleFactor
        ctx.font = `${fontSize}px ${FONTS.OswaldBold}`

        ctx.fillText(machine.name, flagBlockX, coord.y)
        coord.y += fontSize * 2
        ctx.font = `${fontSize}px ${FONTS.Oswald}`
      }

      let flagY = coord.y - 20 * scaleFactor

      for (const lang of dates) {
        const text = (item[`var_release_${lang}`] || '').trim()
        if (!text) continue
        const flag = await loadImage(`data/flags/${lang}.png`)

        const ratio = flag.width / flag.height
        const flagWidth = 50 * scaleFactor
        const flagHeight = flagWidth / ratio
        const textDecalage = flagBlockX + flagWidth + 20 * scaleFactor

        ctx.drawImage(flag, flagBlockX, flagY, flagWidth, flagHeight)
        ctx.fillText(text, textDecalage, flagY + flagHeight / 2 + fontSize / 2)
        flagY += flagHeight + fontSize * 0.85
        fieldBlockX =
          textDecalage + ctx.measureText(machine.name).width + goutiere * 2
      }

      for (const field of fields) {
        const company = itemSource.relations.find(
          (r) => r.relation_type === field
        )
        if (!company) continue

        ctx.font = `${fontSize}px ${FONTS.OswaldBold}`

        ctx.fillText(translateTypeFr(field), fieldBlockX, coord.y)
        coord.y += fontSize * 1.3

        ctx.font = `${fontSize}px ${FONTS.Oswald}`

        ctx.fillText(company.name, fieldBlockX, coord.y)
        coord.y += fontSize * 2
      }

      // ==== END FIRST BLOCK

      // ===================== BLOCK FR
      coord = getTextFromBlock({
        ctx,
        x: margin,
        y: sizeFirstBlock,
        blocks: item.long_description_fr,
        fontSize: descFontSize + 10,
        fontFamily: FONTS.Lato,
        lineHeight: descFontSize * 1.3,
        maxX: maxX / 2 - goutiere,
      })

      // ===================== ENG

      coord = getTextFromBlock({
        ctx,
        x: maxX / 2 + goutiere,
        y: sizeFirstBlock,
        blocks: item.long_description_en,
        fontSize: descFontSize + 10,
        fontFamily: FONTS.LatoItalic,
        lineHeight: descFontSize * 1.3,
        maxX: maxX - margin,
      })
    }
  }

  // -------- [[ BEGING A3 QR ]] -----------------------------------------------------------------------
  if (type === 'a3 qr') {
    const margin = 60 * scaleFactor
    coord.x = margin
    coord.y = margin
    const maxX = widthPixels

    coord.x = margin
    coord.y = coord.y + 50 * scaleFactor

    coord = printCanvasText({
      ctx,
      ...coord,
      text: item.name,
      fontSize: 70 * scaleFactor,
      fontFamily: FONTS.Oswald,
      style: 'bold',
      lineHeight: 50 * scaleFactor,
      maxX,
    })

    // ----- CONST -----

    coord.x = margin

    const goutiere = margin

    const yDesc = coord.y + 60 * scaleFactor
    coord.y = yDesc - 10 * scaleFactor
    coord.x = (maxX - goutiere * 2) / 2.5

    let img

    const fields = ['publisher', 'developer']
    const dates = ['jap', 'us', 'eu']
    const cover = item.medias.find((m) => m.relation_type === 'cover')
    const machine = itemSource.relations.find((it) => it.type === 'machine')

    await QRCode.toFile(
      path.join(__dirname, '../uploads/qr/', `${item.id}.png`),
      `${FRONT_URL}fiches/${item.id}`,
      {
        color: {
          dark: '#000',
          light: '#0000',
        },
        width: widthPixels,
        type: 'svg',
      }
    )
    const qr = await loadImage(`uploads/qr/${item.id}.png`)

    ctx.drawImage(
      qr,
      maxX - size.qrSize * scaleFactor - margin / 2,
      heightPixels - size.qrSize * scaleFactor - margin / 2,
      size.qrSize * scaleFactor,
      size.qrSize * scaleFactor
    )

    if (cover) {
      try {
        if (cover.url.endsWith('.svg')) {
          const svgBuffer = fs.readFileSync(cover.url.slice(1))
          const pngBuffer = await sharp(svgBuffer).png().toBuffer()

          img = await loadImage(pngBuffer)
        } else {
          img = await loadImage(cover.url.slice(1))
        }
      } catch (e) {
        console.error("Erreur lors du chargement de l'image", e)
      }
    }

    if (img) {
      let imgWidth = (widthPixels - goutiere - margin) / 2
      let imgHeight = img.height * (imgWidth / img.width)

      if (imgHeight > heightPixels - coord.y - 150 * scaleFactor - margin) {
        imgHeight = heightPixels - coord.y - 150 * scaleFactor
        imgWidth = img.width * (imgHeight / img.height)
      }

      const imgY = (heightPixels - imgHeight) / 2
      ctx.drawImage(img, margin, imgY, imgWidth, imgHeight)
    }

    coord.y += 50 * scaleFactor
    let fontSize = 50 * scaleFactor
    ctx.font = `${fontSize}px ${FONTS.Oswald}`

    if (machine) {
      ctx.fillStyle = '#4088cf'
      ctx.font = `${fontSize}px ${FONTS.OswaldBold}`

      const textSize = ctx.measureText(machine.name).width

      ctx.fillText(machine.name, widthPixels - textSize - margin, coord.y)
      coord.y += fontSize
      ctx.font = `${fontSize}px ${FONTS.Oswald}`
      ctx.fillStyle = 'black'
    }

    fontSize = 40 * scaleFactor
    ctx.font = `${fontSize}px ${FONTS.Oswald}`
    let currentX = widthPixels - margin

    coord.y += 40 * scaleFactor
    for (lang of dates) {
      const text = item[`var_release_${lang}`]?.trim()
      if (!text) continue
      const flag = await loadImage(`data/flags/${lang}.png`)
      const ratio = flag.width / flag.height
      const flagWidth = 80 * scaleFactor
      const flagHeight = flagWidth / ratio
      const yflag = coord.y - 45 * scaleFactor

      currentX -= ctx.measureText(text).width
      ctx.drawImage(
        flag,
        widthPixels - flagWidth - margin,
        yflag,
        flagWidth,
        flagHeight
      )
      ctx.fillText(text, currentX - flagWidth - 20 * scaleFactor, coord.y)
      currentX = widthPixels - margin
      coord.y += flagHeight + fontSize * 0.85
    }

    coord.y -= 30 * scaleFactor

    for (const field of fields) {
      const company = itemSource.relations.find(
        (r) => r.relation_type === field
      )
      if (!company) continue

      coord.y += 30 * scaleFactor
      ctx.font = `${fontSize}px ${FONTS.OswaldBold}`

      const label = translateTypeFr(field)
      ctx.fillText(
        label,
        widthPixels - ctx.measureText(label).width - margin,
        coord.y
      )
      coord.y += fontSize * 1.3
      ctx.font = `${fontSize}px ${FONTS.Oswald}`

      ctx.fillText(
        company.name,
        widthPixels - ctx.measureText(company.name).width - margin,
        coord.y
      )
      coord.y += fontSize
    }
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
