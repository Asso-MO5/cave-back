const { getItems } = require('../../entities/items')

async function getItemsHandler(req, h) {
  const {
    itemType,
    page,
    limit = 100,
    order,
    sort,
    place,
    status,
    name,
    type,
  } = req.query

  const offset = page ? (page - 1) * parseInt(limit) : 0

  const items = await getItems({
    itemType,
    place,
    status,
    limit: parseInt(limit),
    offset,
    order,
    sort,
    type,
    name,
  })
  return h.response(items).code(200)
}

module.exports = { getItemsHandler }
