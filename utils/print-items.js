const { getItemById, getItemsForExport } = require('../entities/items')
const { printItem } = require('./print-item')
const { printPages } = require('./print-pages')
const fs = require('fs')
const path = require('path')
const AdmZip = require('adm-zip')

async function printItems({ ids: _ids, format, selectedTotal }) {
  const zip = new AdmZip()
  let ids = _ids

  if (selectedTotal) {
    const items = await getItemsForExport({ ids })
    ids = items.map((item) => item.id)
  }

  const images = [] // Tableau pour stocker les chemins des images

  for (const id of ids) {
    const item = await getItemById(id)
    if (!item || (selectedTotal ? item.status !== 'published' : false)) continue
    try {
      const filePath = await printItem(item, format)
      if (!filePath) continue
      images.push(filePath) // Ajouter l'image générée dans le tableau
    } catch (e) {
      console.error(e)
    }
  }

  // Appeler printPages pour générer des planches d'images
  const pages = await printPages(images, 'a4') // Taille de la planche (largeur x hauteur)

  // Ajouter chaque planche dans le fichier ZIP
  for (const page of pages) {
    const fileData = fs.readFileSync(page)
    if (!fileData) continue
    zip.addFile(path.basename(page), fileData)
  }

  return zip.toBuffer()
}

module.exports = { printItems }
