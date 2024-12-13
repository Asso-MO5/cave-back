const { getItemsForExport } = require('../../entities/items')
const { printItems } = require('../../utils/print-items')

async function postItemsExport(req, h) {
  const { exportType, type, ids, format, selectedTotal } = JSON.parse(
    req.payload || '{}'
  )

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
