const { createItemByType } = require('../../utils/create-item')

async function postItems(req, h) {
  const { name, type } = JSON.parse(req.payload || '{}')

  if (!name) return h.response({ error: 'Un nom est requis' }).code(400)
  if (!type) return h.response({ error: 'Un type est requis' }).code(400)

  const id = await createItemByType({
    name,
    type,
    author_id: req.app.user.id,
  })

  // -----|| END CARTEL ||------------------------------------------------------------------

  return h.response({ id }).code(201)
}

module.exports = { postItems }
