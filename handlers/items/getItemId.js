const { getItemById } = require('../../entities/items')

async function getItemId(req, h) {
  const { id } = req.params

  if (!id) return h.response({ error: 'Un id est requis' }).code(400)

  const item = await getItemById(id)

  if (!item) return h.response({ error: 'Non trouvé' }).code(404)

  return h
    .response({
      item: await getItemById(id, req),
    })
    .code(200)
}

module.exports = { getItemId }
