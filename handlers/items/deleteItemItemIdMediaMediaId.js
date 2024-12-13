const { createItemHistory } = require('../../entities/item-history')
const { deleteMediaForItem } = require('../../entities/item-medias')
const { getItemById } = require('../../entities/items')

async function deleteItemItemIdMediaMediaId(req, h) {
  const { itemId, mediaId } = req.params
  const oldItem = await getItemById(itemId)
  if (!oldItem) return h.response({ error: 'Non trouvé' }).code(404)

  try {
    await createItemHistory(oldItem.id, req.app.user.id)
  } catch (error) {
    console.log('ITEM HISTORY :', error)
    return h
      .response({ error: 'Internal server error', details: error })
      .code(500)
  }

  try {
    await deleteMediaForItem({ itemId, mediaId })
  } catch (error) {
    console.log('DELETE MEDIA :', error)
    return h
      .response({ error: 'Internal server error', details: error })
      .code(500)
  }

  return h.response(await getItemById(oldItem.id, req)).code(201)
}

module.exports = { deleteItemItemIdMediaMediaId }
