const {
  deleteItemRelationByLeftIdAndSameType,
  createItemRelation,
} = require('../../entities/item-relations')
const {
  getSimilarItems,
  createOrUpdateItemTextAttrs,
  createOrUpdateItemLongTextAttrs,
} = require('../../entities/items')
const { createItemByType } = require('../../utils/create-item')
const { translateType } = require('../../utils/translate-type')

async function postItemsImport(req, h) {
  const { items, type } = JSON.parse(req.payload || '[')
  if (items.length === 0)
    return h.response({ error: 'Aucun item à importer' }).code(400)

  const ids = []

  for (const item of items) {
    const isExist = await getSimilarItems(item.name, type)

    if (isExist) {
      ids.push(isExist.id)
      continue
    }
    const refType = translateType(item.category)
    const id = await createItemByType({
      name: item.name,
      type,
      author_id: req.app.user.id,
      refType,
    })

    if (item.origin)
      await createOrUpdateItemTextAttrs(
        id,
        'var_origin',
        item.origin,
        req.app.user?.id
      )

    if (item.place)
      await createOrUpdateItemTextAttrs(
        id,
        'var_place',
        item.place,
        req.app.user?.id
      )

    if (item.release_date)
      await createOrUpdateItemTextAttrs(
        id,
        'var_release_fr',
        item.release_date,
        req.app.user?.id
      )

    // ----- TEXT -----
    if (item.description)
      await createOrUpdateItemLongTextAttrs(
        id,
        'long_description_fr',
        item.description,
        req.app.user
      )

    if (item.manufacturer) {
      const companyId = await createItemByType({
        name: item.manufacturer,
        type: 'company',
        author_id: req.app.user.id,
      })

      await deleteItemRelationByLeftIdAndSameType(id, refType)
      await createItemRelation({
        item_ref_id: companyId,
        item_left_id: id,
        relation_type: item.refType,
        author_id: req.app.user.id,
      })
    }
    ids.push(id)
  }

  return h.response({ msg: 'ok' }).code(201)
}

module.exports = { postItemsImport }
