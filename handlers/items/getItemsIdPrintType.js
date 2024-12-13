const { getItemById } = require('../../entities/items')
const { printItem } = require('../../utils/print-item')

async function getItemsIdPrintType(req, h) {
  const { id, type } = req.params
  if (!id) return h.response({ error: 'Un id est requis' }).code(400)
  if (!type) return h.response({ error: 'Un type est requis' }).code(400)

  const item = await getItemById(id)
  if (!item) return h.response({ error: 'Non trouvé' }).code(404)

  try {
    const file = await printItem(item, type)
    return h.file(file)
  } catch (error) {
    console.log('PRINT ITEM :', error)
    return h
      .response({ error: 'Internal server error', details: error })
      .code(500)
  }
}

module.exports = { getItemsIdPrintType }
