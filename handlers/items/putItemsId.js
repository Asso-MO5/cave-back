const { createItemHistory } = require('../../entities/item-history')
const {
  createItemRelation,
  deleteItemRelationByLeftIdAndSameType,
} = require('../../entities/item-relations')
const {
  updateItem,
  changeItemType,
  createOrUpdateItemLongTextAttrs,
  createOrUpdateItemTextAttrs,
  getSimilarItems,
  getItemById,
} = require('../../entities/items')

async function putItemsId(req, h) {
  const { id } = req.params
  if (!id) return h.response({ error: 'Un id est requis' }).code(400)

  const payload = JSON.parse(req.payload || '{}')
  if (payload.name) {
    const { type } = await getItemById(id)
    const existName = await getSimilarItems(payload.name, type, id)
    if (existName)
      return h.response({ error: 'Un item avec ce nom existe déjà' }).code(400)
  }

  await createItemHistory(id, req.app.user.id)

  const keys = Object.keys(payload).join(' ')

  if (keys.match(/var_|long_/)) {
    for (const key in payload) {
      // ----- VARCHAR -----
      if (key.match(/var_/))
        await createOrUpdateItemTextAttrs(
          id,
          key,
          payload[key],
          req.app.user?.id
        )

      // ----- TEXT -----
      if (key.match(/long_/))
        await createOrUpdateItemLongTextAttrs(
          id,
          key,
          payload[key],
          req.app.user
        )
    }
  }
  // ----- TYPE -----
  else if (keys.match(/type/)) {
    await changeItemType(id, payload.type)
  }
  // ----- COMPANY -----
  else if (keys.match(/company/)) {
    await deleteItemRelationByLeftIdAndSameType(id, payload.company.type)
    await createItemRelation({
      item_ref_id: payload.company.id,
      item_left_id: id,
      relation_type: payload.company.type,
      author_id: req.app.user.id,
    })
  } else {
    // ----- ITEM -----
    await updateItem(id, payload)
  }

  return h.response({ item: await getItemById(id, req) }).code(204)
}

module.exports = { putItemsId }
