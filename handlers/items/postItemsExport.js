const { getItemsForExport, getItemById } = require('../../entities/items')
const { printItems } = require('../../utils/print-items')
const { itemsToText } = require('../../utils/items-to-text')

async function postItemsExport(req, h) {
  const { exportType, type, ids, format, selectedTotal } = JSON.parse(
    req.payload || '{}'
  )

  if (exportType === 'txt' || exportType === 'text') {
    try {
      const rows = await getItemsForExport({ type, ids: selectedTotal ? undefined : (ids || []) })
      if (!rows) throw new Error('Impossible de récupérer les items à exporter')
      const items = []
      for (const id of new Set(rows.map((row) => row.id))) {
        const item = await getItemById(id)
        if (!item) throw new Error('Impossible de récupérer un item à exporter')
        items.push(item)
      }
      return h.response(itemsToText(items))
        .header('Content-Type', 'text/plain; charset=utf-8')
        .header('Content-Disposition', 'attachment; filename=export.txt')
        .code(200)
    } catch (error) {
      console.error('TEXT EXPORT :', error)
      return h.response({ error: 'Impossible de générer l’export texte' }).code(500)
    }
  }

  if (exportType === 'csv') {
    const items = await getItemsForExport({ type, ids })
    const csv = items
      .map((item) => {
        delete item.id
        return Object.values(item).join(',')
      })
      .join('\n')

    return h.response(csv).code(200).header('Content-Type', 'text/csv')
  }

  if (exportType.match(/print|place/)) {
    let zipBuffer
    try {
      zipBuffer = await printItems({
        ids,
        format,
        type,
        selectedTotal,
      })
    } catch (error) {
      console.log('PRINT ITEMS :', error)
      return h
        .response({ error: 'Internal server error', details: error })
        .code(500)
    }

    return h
      .response(zipBuffer)
      .header('Content-Type', 'application/zip')
      .header('Content-Disposition', 'attachment; filename=export.zip')
      .code(200)
  }

  return h.response({ msg: 'ok' }).code(204)
}

module.exports = { postItemsExport }
