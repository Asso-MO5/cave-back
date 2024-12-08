const {} = require('../entities/items')
const {
  getLoots,
  createLoot,
  deleteLoot,
  winnedLoot,
} = require('../entities/loot')
const { headers } = require('../models/header.model')
const { ROLES } = require('../utils/constants')

module.exports = [
  {
    method: 'POST',
    path: '/loots',
    options: {
      description: 'Permet de créer un loot',
      tags: ['api', 'loots'],
      notes: [ROLES.publisher, ROLES.admin],
      validate: {
        headers,
      },
    },
    async handler(req, h) {
      const { winnerName, winneremail, loot, eventId } = JSON.parse(
        req.payload || '{}'
      )

      if (!winnerName)
        return h.response({ error: 'Un nom est requis' }).code(400)
      if (!eventId) return h.response({ error: 'Un type est requis' }).code(400)
      if (!loot) return h.response({ error: 'Un loot est requis' }).code(400)

      const id = await createLoot({
        winnerName,
        winneremail: winneremail || '',
        loot,
        eventId,
        winned_at: new Date(),
        creatorId: req.app.user.id,
      })

      // -----|| END CARTEL ||------------------------------------------------------------------

      return h.response({ id }).code(201)
    },
  },
  {
    method: 'GET',
    path: '/loots_public',

    options: {
      description: 'Récupère la liste des loots',
      tags: ['api', 'loots'],
      notes: ['loot'],
      validate: {
        headers,
      },
    },
    async handler(req, h) {
      console.log('req.query', req.app.user.id)
      const { search, searchBy, page, limit = 50, order, sort } = req.query

      const offset = page ? (page - 1) * limit : 0

      const items = await getLoots({
        search,
        searchBy,
        limit,
        offset,
        order,
        sort,
      })
      return h.response(items).code(200)
    },
  },
  {
    method: 'GET',
    path: '/loots',

    options: {
      description: 'Récupère la liste des loots',
      tags: ['api', 'loots'],
      notes: [ROLES.member],
      validate: {
        headers,
      },
    },
    async handler(req, h) {
      const { search, searchBy, page, limit = 50, order, sort } = req.query

      const offset = page ? (page - 1) * limit : 0

      const items = await getLoots({
        search,
        searchBy,
        limit,
        offset,
        order,
        sort,
      })
      return h.response(items).code(200)
    },
  },
  {
    method: 'DELETE',
    path: '/loots/{id}',
    options: {
      description: 'Supprime un loot',
      tags: ['api', 'loots'],
      notes: [ROLES.publisher, ROLES.admin],
      validate: {
        headers,
      },
    },
    async handler(req, h) {
      const { id } = req.params

      const item = await getLoots({ id })

      if (!item) return h.response({ error: 'Loot non trouvé' }).code(404)

      await deleteLoot(id)

      return h.response().code(204)
    },
  },
  {
    method: 'PUT',
    path: '/loots/win_public/{id}',
    options: {
      description: 'Permet de valider un loot',
      tags: ['api', 'loots'],
    },
    async handler(req, h) {
      const { id, withdrawalId } = req.params

      const lootAdminsStr = process.env.LOOT_ADMINS || '' // '1,2,3'
      const lootAdmins = lootAdminsStr.split(',').map(Number)
      if (!lootAdmins.includes(withdrawalId))
        return h.response({ error: "Vous n'avez pas les droits" }).code(403)

      const item = await getLoots({ id })

      if (!item) return h.response({ error: 'Loot non trouvé' }).code(404)

      await winnedLoot({
        id,
        winned_at: new Date(),
        withdrawalId: withdrawalId,
      })

      return h.response().code(204)
    },
  },
  {
    method: 'PUT',
    path: '/loots/win/{id}',
    options: {
      description: 'Permet de valider un loot',
      tags: ['api', 'loots'],
      notes: [ROLES.publisher, ROLES.admin],
      validate: {
        headers,
      },
    },
    async handler(req, h) {
      const { id } = req.params

      const item = await getLoots({ id })

      if (!item) return h.response({ error: 'Loot non trouvé' }).code(404)

      await winnedLoot({
        id,
        winned_at: new Date(),
        withdrawalId: req.app.user.id,
      })

      return h.response().code(204)
    },
  },
]
