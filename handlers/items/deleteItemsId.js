const { deleteItem } = require('../../entities/items')

async function deleteItemsId(req, h) {
  const { id } = req.params
  if (!id) return h.response({ error: 'Un id est requis' }).code(400)

  try {
    await deleteItem(id)
  } catch (error) {
    console.log('DELETE ITEM :', error)
    return h
      .response({ error: 'Internal server error', details: error })
      .code(500)
  }

  return h.response({ msg: 'ok' }).code(204)
}

module.exports = { deleteItemsId }
