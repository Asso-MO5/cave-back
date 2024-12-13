const { createItemHistory } = require('../../entities/item-history')
const { updateOrCreateMediaForItem } = require('../../entities/item-medias')
const { getItemById } = require('../../entities/items')
const { createMedia } = require('../../entities/media')
const { getMediaFromUrl } = require('../../utils/get-media-from-url')

async function putItemIdMedia(req, h) {
  const data = req.payload
  const oldItem = await getItemById(req.params.id)
  if (!oldItem) return h.response({ error: 'Non trouvé' }).code(404)
  const type = data.create ? `${data.media}-${uuidv4()}` : data.media

  try {
    await createItemHistory(oldItem.id, req.app.user.id)
  } catch (error) {
    console.log('ITEM HISTORY :', error)
    return h
      .response({ error: 'Internal server error', details: error })
      .code(500)
  }

  if (data.file && data.file?.hapi?.filename) {
    const [{ id: mediaId }] = await createMedia([data.file])

    try {
      await updateOrCreateMediaForItem({
        itemId: oldItem.id,
        mediaId,
        authorId: req.app.user.id,
        type,
      })
    } catch (error) {
      return h
        .response({ error: 'Internal server error', details: error })
        .code(500)
    }
  }

  if (data.id) {
    try {
      await updateOrCreateMediaForItem({
        itemId: oldItem.id,
        mediaId: data.id,
        authorId: req.app.user.id,
        type,
      })
    } catch (error) {
      return h
        .response({ error: 'Internal server error', details: error })
        .code(500)
    }
  }

  if (data.url && data.url.includes('http')) {
    const file = await getMediaFromUrl(data.url)

    const [{ id: mediaId }] = await createMedia([file])

    try {
      await updateOrCreateMediaForItem({
        itemId: oldItem.id,
        mediaId,
        authorId: req.app.user.id,
        type,
      })
    } catch (error) {
      return h
        .response({
          error: 'Internal server error',
          details: error,
        })
        .code(500)
    }
  }

  return h.response(await getItemById(oldItem.id, req)).code(201)
}

module.exports = { putItemIdMedia }
