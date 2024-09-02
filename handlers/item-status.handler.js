const { createItemHistory } = require('../entities/item-history')
const { getItemById, updateItem } = require('../entities/items')
const { getMediaUrl } = require('../utils/media-url')

module.exports = async (req, h) => {
  const oldItem = await getItemById(req.params.id)
  if (!oldItem) return h.response({ error: 'Non trouvé' }).code(404)

  const status = req.params.status

  // ====== COVER ==========================================================

  try {
    await createItemHistory(oldItem.id)
  } catch (error) {
    console.log('ITEM HISTORY :', error)
    return h
      .response({ error: 'Internal server error', details: error })
      .code(500)
  }

  try {
    await updateItem(oldItem.id, {
      status,
      author_id: req.app.user.id,
    })
  } catch (error) {
    console.log('ITEM UPDATE :', error)
    return h
      .response({ error: 'Internal server error', details: error })
      .code(500)
  }

  return h
    .response({
      ...oldItem,
      status,
      cover_url: getMediaUrl(oldItem.cover_url, req),
    })
    .code(201)
}
