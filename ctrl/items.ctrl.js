const Joi = require('joi')
const { createMedia } = require('../entities/media')
const {
  createItems,
  getItemById,
  updateItem,
  getItems,
} = require('../entities/items')
const { getMediaUrl } = require('../utils/media-url')
const { createItemHistory } = require('../entities/item-history')
const { replaceCompanyForItem } = require('../entities/item-company')

const {
  createRelation,
  getRelationbyLeftIdAndRightId,
  getRelationByReIdAndType,
} = require('../entities/item-items')
const { ROLES } = require('../utils/constants')
const {
  ITEM_MODEL,
  ITEM_CREATE_PAYLOAD_MODEL,
  ITEM_SEARCH_MODEL,
  ITEM_SEARCH_QUERY_MODEL,
} = require('../models/item.model')
const itemStatusHandler = require('../handlers/item-status.handler')
const itemCreateHandler = require('../handlers/item-create.handler')
const { headers } = require('../models/header.model')

module.exports = [
  {
    method: 'GET',
    path: '/items',

    options: {
      description: 'Récupère la liste des items par type et recherche',
      tags: ['api', 'jeux'],
      notes: [ROLES.member],
      validate: {
        query: ITEM_SEARCH_QUERY_MODEL.required(),
        headers,
      },
      response: {
        status: {
          200: ITEM_SEARCH_MODEL.required(),
        },
      },
    },
    async handler(req, h) {
      const { error } = ITEM_SEARCH_QUERY_MODEL.validate(req.query)
      if (error) return h.response({ error: error.message }).code(400)
      try {
        const items = await getItems(req.query.type, req.query.search)
        return h
          .response(
            items.map((item) => ({
              name: item.related_item_name
                ? `${item.name} (${item.related_item_name})`
                : item.name,
              slug: item.slug,
            }))
          )
          .code(200)
      } catch (error) {
        console.log('ITEMS GET :', error)
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }
    },
  },
  {
    method: 'POST',
    path: '/items',
    options: {
      description: 'Permet de créer un item (jeu, machine, liste...)',
      tags: ['api', 'jeu', 'machine', 'expositions'],
      notes: [ROLES.reviewer, ROLES.publisher],
      validate: {
        payload: ITEM_CREATE_PAYLOAD_MODEL,
        headers,
      },
      response: {
        status: {
          201: Joi.object({
            id: Joi.string().required(),
            slug: Joi.string().required(),
          })
            .label('itemCreated')
            .required(),
        },
      },
    },
    handler: itemCreateHandler,
  },
  {
    method: 'PUT',
    path: '/machine/{machine_id}/game/{ref_id}',
    options: {
      description: 'Permet de lier un jeu à une machine',
      tags: ['api', 'jeu', 'machine', 'expositions'],
      notes: [ROLES.reviewer, ROLES.publisher],
      validate: {
        headers,
      },
      response: {
        status: {
          200: ITEM_MODEL.required(),
          201: ITEM_MODEL.required(),
        },
      },
    },
    async handler(req, h) {
      const { machine_id, ref_id } = req.params

      const refItem = await getItemById(ref_id)

      const relation = await getRelationbyLeftIdAndRightId(ref_id, machine_id)

      if (relation) return h.response(refItem).code(200)

      const existOtherRelation = await getRelationByReIdAndType(
        ref_id,
        'machine_game'
      )

      if (!existOtherRelation?.id) {
        await createRelation(
          ref_id,
          ref_id,
          machine_id,
          'machine_game',
          req.app.user.id
        )

        return h.response(refItem).code(201)
      }

      const newItem = await createItems({
        name: refItem.name,
        author_id: req.app.user.id,
        type: 'game',
      })

      await createRelation(
        ref_id,
        newItem.id,
        machine_id,
        'machine_game',
        req.app.user.id
      )

      return h.response(await getItemById(newItem.id)).code(201)
    },
  },
  {
    method: 'PUT',
    path: '/items/{id}',
    options: {
      notes: [ROLES.reviewer, ROLES.publisher],
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

      if (data.status)
        return h
          .response({
            error: 'Vous ne pouvez pas modifier le status via cette route',
          })
          .code(400)

      // ====== COVER ==========================================================

      try {
        await createItemHistory(oldItem.id)
      } catch (error) {
        console.log('ITEM HISTORY :', error)
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }

      if (data.cover && data.cover?.hapi?.filename) {
        const [cover] = await createMedia([data.cover])

        oldItem.cover_id = cover.id
        try {
          await updateItem(oldItem.id, {
            cover_id: cover.id,
            author_id: req.app.user.id,
          })
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
          await updateItem(oldItem.id, {
            cover_id: data.cover_id,
            author_id: req.app.user.id,
          })
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
          await updateItem(oldItem.id, {
            cover_id: cover.id,
            author_id: req.app.user.id,
          })
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
      // ====== COMPANIES ==========================================================
      if (data.company_id) {
        // Replace the old company
        if (data.company_old_id) {
          try {
            // create if not exist
            const newCompany = await replaceCompanyForItem(
              oldItem.id,
              data.company_id,
              data.company_old_id,
              data.company_relation_type,
              req.app.user.id
            )
            oldItem[data.company_relation_type] = newCompany
            return h.response(oldItem).code(201)
          } catch (error) {
            console.log('COMPANY REPLACE :', error)
            return h
              .response({ error: 'Internal server error', details: error })
              .code(500)
          }
        }

        return h.response(oldItem).code(201)
      }

      try {
        await updateItem(oldItem.id, {
          ...data,
          author_id: req.app.user.id,
        })
      } catch (error) {
        console.log('ITEM UPDATE :', error)
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }

      return h.response(oldItem).code(201)
    },
  },
  {
    method: 'PUT',
    path: '/items/{id}/status/{status}',
    options: {
      description: "Permet de changer le status d'un item",
      tags: ['api', 'items', 'listes', 'machines', 'jeux'],
      notes: [ROLES.reviewer],
      validate: {
        payload: Joi.object({}).label('ItemStatusBody'),
        headers,
      },
      response: {
        status: {
          201: ITEM_MODEL.label('ItemStatusUpdated').required(),
        },
      },
    },
    handler: itemStatusHandler,
  },
]
