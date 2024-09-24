const { createCanvas, loadImage } = require('@napi-rs/canvas')
const fs = require('fs')
const path = require('path')
const { SIZES } = require('./constants')

async function printPages(imgs, format) {
  if (!SIZES?.[format]?.width) throw new Error('Type de print inconnu')

  const size = SIZES[format]
  const DPI = 300
  const pageWidth = Math.round((size.width / 25.4) * DPI)
  const pageHeight = Math.round((size.height / 25.4) * DPI)

  if (imgs.length === 0) return [] // S'il n'y a pas d'images, retourne une liste vide

  // Charger la première image pour obtenir sa taille
  const firstImage = await loadImage(imgs[0])
  const imgWidth = firstImage.width
  const imgHeight = firstImage.height

  // Calculer le nombre d'images par ligne et par colonne
  const imgsPerRow = Math.floor(pageWidth / (imgWidth + 1)) // Ajout d'1 pixel entre les images
  const imgsPerCol = Math.floor(pageHeight / (imgHeight + 1))

  // Calculer l'espace restant pour centrer les images
  const totalImgWidth = imgsPerRow * imgWidth + (imgsPerRow - 1) * 1 // Total avec marge entre les colonnes
  const totalImgHeight = imgsPerCol * imgHeight + (imgsPerCol - 1) * 1 // Total avec marge entre les lignes

  const offsetX = (pageWidth - totalImgWidth) / 2 // Centrage horizontal
  const offsetY = (pageHeight - totalImgHeight) / 2 // Centrage vertical

  const canvas = createCanvas(pageWidth, pageHeight)
  const ctx = canvas.getContext('2d')

  let imgIndex = 0
  const pages = []

  // Tant qu'il reste des images à traiter
  while (imgIndex < imgs.length) {
    // Réinitialise le canvas pour chaque nouvelle planche
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, pageWidth, pageHeight) // Remplir le fond en blanc

    // Remplir la planche avec les images
    for (let row = 0; row < imgsPerCol; row++) {
      for (let col = 0; col < imgsPerRow; col++) {
        if (imgIndex >= imgs.length) break

        // Charger l'image actuelle
        const img = await loadImage(imgs[imgIndex])

        // Calculer les positions avec l'espacement et le centrage
        const x = offsetX + col * (imgWidth + 1) // Ajout d'1 pixel entre les colonnes
        const y = offsetY + row * (imgHeight + 1) // Ajout d'1 pixel entre les lignes

        ctx.fillStyle = '#dddddd' // Bordures en noir

        // Dessiner les coins de coupe (5x5 pixels aux coins)
        const cutSize = 6
        ctx.fillRect(x - 1, y - 1, cutSize, cutSize) // Haut gauche
        ctx.fillRect(x + imgWidth - cutSize, y - 1, cutSize, cutSize) // Haut droite
        ctx.fillRect(x - 1, y + imgHeight - cutSize, cutSize, cutSize) // Bas gauche
        ctx.fillRect(
          x + imgWidth - cutSize,
          y + imgHeight - cutSize,
          cutSize,
          cutSize
        ) // Bas droite

        // Dessiner l'image
        ctx.drawImage(img, x, y, imgWidth, imgHeight)

        imgIndex++
      }
    }

    // Convertir la planche en image
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

  return pages // Renvoie les chemins des planches générées
}

module.exports = { printPages }
