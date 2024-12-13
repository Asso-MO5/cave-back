const { createItemHistory } = require('../../entities/item-history')
const { updateItem, getItemById } = require('../../entities/items')

async function putItemIdStatusStatus(req, h) {
  const { id, status } = req.params
  if (!id) return h.response({ error: 'Un id est requis' }).code(400)
  if (!status) return h.response({ error: 'Un status est requis' }).code(400)

  await createItemHistory(id, req.app.user.id)
  await updateItem(id, { status })

  const item = await getItemById(id)
  return h.response({ item }).code(204)
}

module.exports = { putItemIdStatusStatus }
