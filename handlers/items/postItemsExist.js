const { getSimilarItems } = require('../../entities/items')

async function postItemsExist(req, h) {
  const { name, type, id = '__NEW__' } = JSON.parse(req.payload || '{}')

  if (!name) return h.response({ error: 'Un nom est requis' }).code(400)
  if (!type) return h.response({ error: 'Un type est requis' }).code(400)

  const item = await getSimilarItems(name, type, id)
  return h.response({ exist: !!item }).code(200)
}

module.exports = { postItemsExist }
