const { getItems } = require('../../entities/items')

async function getItemsPublic(req, h) {
  const { search, searchBy, page, limit = 50, order, sort, place } = req.query

  const offset = page ? (page - 1) * limit : 0

  const items = await getItems({
    // type: 'cartel',
    search,
    searchBy,
    limit,
    offset,
    order,
    place,
    sort,
    status: 'published',
  })
  return h.response(items).code(200)
}

module.exports = { getItemsPublic }
