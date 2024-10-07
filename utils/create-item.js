const { createItemRelation } = require('../entities/item-relations')
const { getSimilarCartel, createItem } = require('../entities/items')

async function createItemByType({ name, type, author_id, refType, ...rest }) {
  const id = await createItem({
    name,
    type,
    author_id,
  })

  // -----|| CARTEL ||------------------------------------------------------------------
  if (type === 'cartel') {
    const itemRelation = {
      item_ref_id: id,
      item_left_id: id,
      relation_type: 'cartel',
      author_id,
    }

    const searchSimilar = await getSimilarCartel(name)
    if (searchSimilar) {
      itemRelation.item_ref_id = searchSimilar.id
    } else {
      const refId = await createItem({
        name,
        type: refType || 'obj',
        author_id,
        ...rest,
      })
      itemRelation.item_ref_id = refId
    }

    await createItemRelation(itemRelation)
  }

  return id
}

module.exports = {
  createItemByType,
}
