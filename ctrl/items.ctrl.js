const { updateOrCreateCover } = require('../entities/item-medias')
const { createItemRelation } = require('../entities/item-relations')
const {
  createItem,
  getItemById,
  updateItem,
  createOrUpdateItemTextAttrs,
  createOrUpdateItemLongTextAttrs,
  getItems,
  deleteItem,
  getSimilarCartel,
  changeItemType,
} = require('../entities/items')
const { createMedia } = require('../entities/media')
const { headers } = require('../models/header.model')
const { ROLES } = require('../utils/constants')
const { getMediaFromUrl } = require('../utils/get-media-from-url')
const { getMediaUrl } = require('../utils/media-url')

module.exports = [
  {
    method: 'POST',
    path: '/items',
    options: {
      description: 'Permet de créer un item',
      tags: ['api', 'jeux'],
      notes: [ROLES.publisher, ROLES.reviewer],
      validate: {
        headers,
      },
    },
    async handler(req, h) {
      const { name, type } = JSON.parse(req.payload || '{}')
      if (!name) return h.response({ error: 'Un nom est requis' }).code(400)
      if (!type) return h.response({ error: 'Un type est requis' }).code(400)

      const id = await createItem({
        name,
        type,
        author_id: req.app.user.id,
      })

      // -----|| CARTEL ||------------------------------------------------------------------
      if (type === 'cartel') {
        const itemRelation = {
          item_ref_id: id,
          item_left_id: id,
          relation_type: 'cartel',
          author_id: req.app.user.id,
        }

        const searchSimilar = await getSimilarCartel(name)
        if (searchSimilar) {
          itemRelation.item_ref_id = searchSimilar.id
        } else {
          const refId = await createItem({
            name,
            type: 'obj',
            author_id: req.app.user.id,
          })
          itemRelation.item_ref_id = refId
        }

        await createItemRelation(itemRelation)
      }

      // -----|| END CARTEL ||------------------------------------------------------------------

      return h.response({ id }).code(201)
    },
  },
  {
    method: 'GET',
    path: '/items',

    options: {
      description: 'Récupère la liste des items par type et recherche',
      tags: ['api', 'jeux'],
      notes: [ROLES.member],
      validate: {
        headers,
      },
    },
    async handler(req, h) {
      const { type, search, page, limit = 5 } = req.query

      const offset = page ? (page - 1) * limit : 0
      const items = await getItems({ type, search, limit, offset })
      return h.response(items).code(200)
    },
  },
  {
    method: 'GET',
    path: '/item/{id}',

    options: {
      description: 'Récupère un item par son id',
      tags: ['api', 'jeux'],
      notes: [ROLES.member],
      validate: {
        headers,
      },
    },
    async handler(req, h) {
      const { id } = req.params
      if (!id) return h.response({ error: 'Un id est requis' }).code(400)
      const item = await getItemById(id)

      return h
        .response({
          item: {
            ...item,
            medias: item.medias.map((media) => ({
              ...media,
              url: getMediaUrl(media.url, req),
            })),
          },
        })
        .code(200)
    },
  },
  {
    method: 'PUT',
    path: '/item/{id}',
    options: {
      description: 'Permet de modifier un item',
      tags: ['api', 'jeux'],
      notes: [ROLES.publisher, ROLES.reviewer],
      validate: {
        headers,
      },
    },
    async handler(req, h) {
      const { id } = req.params
      if (!id) return h.response({ error: 'Un id est requis' }).code(400)

      const payload = JSON.parse(req.payload || '{}')

      const keys = Object.keys(payload).join(' ')

      // ----- TYPE -----
      /**
       * @description Si le type est modifié, il faut supprimer les relations et les attributs textuels
       */

      if (keys.match(/place|description|origin/)) {
        for (const key in payload) {
          // ----- VARCHAR -----
          if (key.match(/place|origin/))
            await createOrUpdateItemTextAttrs(
              id,
              key,
              payload[key],
              req.app.user
            )

          // ----- TEXT -----
          if (key.match(/description/))
            await createOrUpdateItemLongTextAttrs(
              id,
              key,
              payload[key],
              req.app.user
            )
        }
      } else if (keys.match(/type/)) {
        await changeItemType(id, payload.type)
      } else {
        // ----- ITEM -----
        await updateItem(id, payload)
      }

      const item = await getItemById(id)
      return h.response({ item }).code(204)
    },
  },
  {
    method: 'PUT',
    path: '/item/{id}/status/{status}',
    options: {
      description: "Permet de modifier le status d'un item",
      tags: ['api', 'jeux'],
      notes: [ROLES.publisher, ROLES.reviewer],
      validate: {
        headers,
      },
    },
    async handler(req, h) {
      const { id, status } = req.params
      if (!id) return h.response({ error: 'Un id est requis' }).code(400)
      if (!status)
        return h.response({ error: 'Un status est requis' }).code(400)

      await updateItem(id, { status })

      const item = await getItemById(id)
      return h.response({ item }).code(204)
    },
  },

  {
    method: 'PUT',
    path: '/item/{id}/media',
    options: {
      notes: [ROLES.reviewer, ROLES.publisher],
      description: 'Permet de mettre à jour le media d un item',
      tags: ['api', 'items'],
      payload: {
        parse: true,
        output: 'stream',
        multipart: true,
        maxBytes: 800 * 1024 * 1024, //800 mb
      },
    },
    async handler(req, h) {
      const data = req.payload
      const oldItem = await getItemById(req.params.id)
      if (!oldItem) return h.response({ error: 'Non trouvé' }).code(404)

      try {
        //  await createItemHistory(oldItem.id)
      } catch (error) {
        console.log('ITEM HISTORY :', error)
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }

      // ====== COVER ==========================================================
      if (data.cover && data.cover?.hapi?.filename) {
        const [cover] = await createMedia([data.cover])

        oldItem.cover_id = cover.id
        try {
          await updateOrCreateCover(oldItem.id, cover.id, req.app.user.id)
        } catch (error) {
          return h
            .response({ error: 'Internal server error', details: error })
            .code(500)
        }

        oldItem.cover_url = getMediaUrl(cover.url, req)

        return h.response(oldItem).code(201)
      }

      if (data.cover_id) {
        try {
          await updateOrCreateCover(oldItem.id, data.cover_id, req.app.user.id)
        } catch (error) {
          return h
            .response({ error: 'Internal server error', details: error })
            .code(500)
        }

        return h.response(oldItem).code(201)
      }

      if (data.cover_url && data.cover_url.includes('http')) {
        const file = await getMediaFromUrl(data.cover_url)
        const [cover] = await createMedia([file])
        oldItem.cover_id = cover.id
        try {
          await updateOrCreateCover(oldItem.id, cover.id, req.app.user.id)
        } catch (error) {
          return h
            .response({
              error: 'Internal server error',
              details: error,
            })
            .code(500)
        }

        oldItem.cover_url = getMediaUrl(cover.url, req)

        return h.response(oldItem).code(201)
      }

      return h.response(oldItem).code(201)
    },
  },
  {
    method: 'DELETE',
    path: '/items/{id}',
    options: {
      description: 'Permet de supprimer un item',
      tags: ['api', 'jeux'],
      notes: [ROLES.publisher, ROLES.reviewer],
      validate: {
        headers,
      },
    },
    async handler(req, h) {
      const { id } = req.params
      if (!id) return h.response({ error: 'Un id est requis' }).code(400)

      await deleteItem(id)

      return h.response({ msg: 'ok' }).code(204)
    },
  },
]
