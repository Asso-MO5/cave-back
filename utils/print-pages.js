const { createCanvas, loadImage } = require('@napi-rs/canvas')
const fs = require('fs')
const path = require('path')
const { SIZES } = require('./constants')

async function printPages(imgs, format = 'cartes') {
  if (!SIZES?.[format]?.width) throw new Error('Type de print inconnu')

  const DPI = 300
  const cardWidthMM = 85 // Largeur de la carte de visite en mm
  const cardHeightMM = 54 // Hauteur de la carte de visite en mm

  const pageWidth = Math.round((210 / 25.4) * DPI) // Largeur A4 210 mm
  const pageHeight = Math.round((297 / 25.4) * DPI) // Hauteur A4 297 mm

  const cardWidthPx = Math.round((cardWidthMM / 25.4) * DPI)
  const cardHeightPx = Math.round((cardHeightMM / 25.4) * DPI)

  const marginTop = Math.round((15 / 25.4) * DPI) // Marge en haut 15 mm
  const marginLeft = Math.round((15 / 25.4) * DPI) // Marge à gauche 15 mm
  const marginMiddle = Math.round((10 / 25.4) * DPI) // Marge au milieu 10 mm

  const imgsPerRow = 2 // 2 colonnes
  const imgsPerCol = 5 // 5 cartes par colonne

  const canvas = createCanvas(pageWidth, pageHeight)
  const ctx = canvas.getContext('2d')

  let imgIndex = 0
  const pages = []

  // Tant qu'il reste des images à traiter
  while (imgIndex < imgs.length) {
    // Réinitialiser le canvas pour chaque nouvelle page
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, pageWidth, pageHeight) // Remplir le fond en blanc

    // Remplir la planche avec les images
    for (let row = 0; row < imgsPerCol; row++) {
      for (let col = 0; col < imgsPerRow; col++) {
        if (imgIndex >= imgs.length) break

        // Calculer les positions de chaque carte
        const x = marginLeft + col * (cardWidthPx + marginMiddle) // Colonnes
        const y = marginTop + row * cardHeightPx // Rangées

        // Charger l'image actuelle
        const img = await loadImage(imgs[imgIndex])

        // Dessiner l'image sur la carte
        ctx.drawImage(img, x, y, cardWidthPx, cardHeightPx)

        imgIndex++
      }
    }

    // Convertir la page en image
    const bufferPage = Buffer.from(
      canvas.toDataURL().replace('data:image/png;base64,', ''),
      'base64'
    )
    const pageFilePath = path.join(
      __dirname,
      `../uploads/print/planche-${imgIndex}.png`
    )
    fs.writeFileSync(pageFilePath, bufferPage)

    pages.push(pageFilePath)
  }

  return pages
}

module.exports = { printPages }
