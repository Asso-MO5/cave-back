const { createItemHistory } = require('../../entities/item-history')
const {
  deleteMediaForItem,
  isMediaUsedByOtherItems,
} = require('../../entities/item-medias')
const { getItemById } = require('../../entities/items')
const { deleteMedia } = require('../../entities/media')

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

  // Vérifier si le média est utilisé par d'autres items
  try {
    const isUsedByOthers = await isMediaUsedByOtherItems({ itemId, mediaId })
    if (!isUsedByOthers) {
      // Si le média n'est plus utilisé par aucun autre item, supprimer le fichier physique
      await deleteMedia(mediaId)
    }
  } catch (error) {
    console.log('DELETE MEDIA FILE :', error)
    // On continue même si la suppression du fichier échoue
  }

  return h.response(await getItemById(oldItem.id, req)).code(201)
}

module.exports = { deleteItemItemIdMediaMediaId }
