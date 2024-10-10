const {
  updateOrCreateMediaForItem,
  deleteMediaForItem,
} = require('../entities/item-medias')
const {
  createItemRelation,
  deleteItemRelationByLeftIdAndSameType,
} = require('../entities/item-relations')
const {
  getItemById,
  updateItem,
  createOrUpdateItemTextAttrs,
  createOrUpdateItemLongTextAttrs,
  getItems,
  deleteItem,
  changeItemType,
  getItemsForExport,
  getSimilarItems,
} = require('../entities/items')
const { createMedia } = require('../entities/media')
const { headers } = require('../models/header.model')
const { ROLES } = require('../utils/constants')
const { getMediaFromUrl } = require('../utils/get-media-from-url')
const { getMediaUrl } = require('../utils/media-url')
const { printItem } = require('../utils/print-item')

const { createItemHistory } = require('../entities/item-history')
const { v4: uuidv4 } = require('uuid')
const { printItems } = require('../utils/print-items')
const { createItemByType } = require('../utils/create-item')
const { translateType } = require('../utils/translate-type')

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

      const id = await createItemByType({
        name,
        type,
        author_id: req.app.user.id,
      })

      // -----|| END CARTEL ||------------------------------------------------------------------

      return h.response({ id }).code(201)
    },
  },
  {
    method: 'POST',
    path: '/items/import',
    options: {
      description: 'Permet d importer des items',
      tags: ['api', 'jeux'],
      notes: [ROLES.publisher, ROLES.reviewer],
      validate: {
        headers,
      },
    },
    async handler(req, h) {
      const { items, type } = JSON.parse(req.payload || '[')
      if (items.length === 0)
        return h.response({ error: 'Aucun item à importer' }).code(400)

      const ids = []

      for (const item of items) {
        const isExist = await getSimilarItems(item.name, type)

        if (isExist) {
          ids.push(isExist.id)
          continue
        }
        const refType = translateType(item.category)
        const id = await createItemByType({
          name: item.name,
          type,
          author_id: req.app.user.id,
          refType,
        })

        if (item.origin)
          await createOrUpdateItemTextAttrs(
            id,
            'var_origin',
            item.origin,
            req.app.user?.id
          )

        if (item.place)
          await createOrUpdateItemTextAttrs(
            id,
            'var_place',
            item.place,
            req.app.user?.id
          )

        if (item.release_date)
          await createOrUpdateItemTextAttrs(
            id,
            'var_release_fr',
            item.release_date,
            req.app.user?.id
          )

        // ----- TEXT -----
        if (item.description)
          await createOrUpdateItemLongTextAttrs(
            id,
            'long_description_fr',
            item.description,
            req.app.user
          )

        if (item.manufacturer) {
          const companyId = await createItemByType({
            name: item.manufacturer,
            type: 'company',
            author_id: req.app.user.id,
          })

          await deleteItemRelationByLeftIdAndSameType(id, refType)
          await createItemRelation({
            item_ref_id: companyId,
            item_left_id: id,
            relation_type: item.refType,
            author_id: req.app.user.id,
          })
        }
        ids.push(id)
      }

      return h.response({ msg: 'ok' }).code(201)
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
      const {
        itemType,
        page,
        limit = 50,
        order,
        sort,
        place,
        status,
        name,
        type,
      } = req.query

      const offset = page ? (page - 1) * limit : 0

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
    },
  },
  {
    method: 'GET',
    path: '/items/public',

    options: {
      description: 'Récupère la liste des items par type et recherche',
      tags: ['api', 'jeux'],
      validate: {
        headers,
      },
    },
    async handler(req, h) {
      const { search, searchBy, page, limit = 50, order, sort } = req.query

      const offset = page ? (page - 1) * limit : 0

      const items = await getItems({
        type: 'cartel',
        search,
        searchBy,
        limit,
        offset,
        order,
        sort,
        status: 'published',
      })
      return h.response(items).code(200)
    },
  },
  {
    method: 'POST',
    path: '/items/exist',
    options: {
      description: 'Vérifie si un item existe',
      tags: ['api', 'jeux'],
      notes: [ROLES.publisher, ROLES.reviewer],
      validate: {
        headers,
      },
    },
    async handler(req, h) {
      const { name, type, id = '__NEW__' } = JSON.parse(req.payload || '{}')

      if (!name) return h.response({ error: 'Un nom est requis' }).code(400)
      if (!type) return h.response({ error: 'Un type est requis' }).code(400)

      const item = await getSimilarItems(name, type, id)
      return h.response({ exist: !!item }).code(200)
    },
  },
  {
    method: 'GET',
    path: '/item/public/{id}',
    options: {
      description: 'Récupère un item par son id',
      tags: ['api', 'jeux'],
    },
    async handler(req, h) {
      const { id } = req.params

      if (!id) return h.response({ error: 'Un id est requis' }).code(400)
      const item = await getItemById(id)
      if (!item) return h.response({ error: 'Non trouvé' }).code(404)

      const relations = {}
      for (const relation of item.relations) {
        const rel = await getItemById(relation.id)
        relations[rel.type] = rel
      }

      return h
        .response({
          item: {
            ...item,
            ...relations,
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
      if (!item) return h.response({ error: 'Non trouvé' }).code(404)

      return h
        .response({
          item: await getItemById(id, req),
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
      if (payload.name) {
        const { type } = await getItemById(id)
        const existName = await getSimilarItems(payload.name, type, id)
        if (existName)
          return h
            .response({ error: 'Un item avec ce nom existe déjà' })
            .code(400)
      }

      await createItemHistory(id, req.app.user.id)

      const keys = Object.keys(payload).join(' ')

      if (keys.match(/var_|long_/)) {
        for (const key in payload) {
          // ----- VARCHAR -----
          if (key.match(/var_/))
            await createOrUpdateItemTextAttrs(
              id,
              key,
              payload[key],
              req.app.user?.id
            )

          // ----- TEXT -----
          if (key.match(/long_/))
            await createOrUpdateItemLongTextAttrs(
              id,
              key,
              payload[key],
              req.app.user
            )
        }
      }
      // ----- TYPE -----
      else if (keys.match(/type/)) {
        await changeItemType(id, payload.type)
      }
      // ----- COMPANY -----
      else if (keys.match(/company/)) {
        await deleteItemRelationByLeftIdAndSameType(id, payload.company.type)
        await createItemRelation({
          item_ref_id: payload.company.id,
          item_left_id: id,
          relation_type: payload.company.type,
          author_id: req.app.user.id,
        })
      } else {
        // ----- ITEM -----
        await updateItem(id, payload)
      }

      return h.response({ item: await getItemById(id, req) }).code(204)
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

      await createItemHistory(id, req.app.user.id)
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
      const type = data.create ? `${data.media}-${uuidv4()}` : data.media

      try {
        await createItemHistory(oldItem.id, req.app.user.id)
      } catch (error) {
        console.log('ITEM HISTORY :', error)
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }

      if (data.file && data.file?.hapi?.filename) {
        const [{ id: mediaId }] = await createMedia([data.file])

        try {
          await updateOrCreateMediaForItem({
            itemId: oldItem.id,
            mediaId,
            authorId: req.app.user.id,
            type,
          })
        } catch (error) {
          return h
            .response({ error: 'Internal server error', details: error })
            .code(500)
        }
      }

      if (data.id) {
        try {
          await updateOrCreateMediaForItem({
            itemId: oldItem.id,
            mediaId: data.id,
            authorId: req.app.user.id,
            type,
          })
        } catch (error) {
          return h
            .response({ error: 'Internal server error', details: error })
            .code(500)
        }
      }

      if (data.url && data.url.includes('http')) {
        const file = await getMediaFromUrl(data.url)

        const [{ id: mediaId }] = await createMedia([file])

        try {
          await updateOrCreateMediaForItem({
            itemId: oldItem.id,
            mediaId,
            authorId: req.app.user.id,
            type,
          })
        } catch (error) {
          return h
            .response({
              error: 'Internal server error',
              details: error,
            })
            .code(500)
        }
      }

      return h.response(await getItemById(oldItem.id, req)).code(201)
    },
  },
  {
    method: 'DELETE',
    path: '/item/{itemId}/media/{mediaId}',
    options: {
      notes: [ROLES.reviewer, ROLES.publisher],
      description: 'Permet de supprimer un media d un item',
      tags: ['api', 'items'],
    },
    async handler(req, h) {
      const { itemId, mediaId } = req.params
      const oldItem = await getItemById(itemId)
      if (!oldItem) return h.response({ error: 'Non trouvé' }).code(404)

      try {
        await createItemHistory(oldItem.id, req.app.user.id)
      } catch (error) {
        console.log('ITEM HISTORY :', error)
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }

      try {
        await deleteMediaForItem({ itemId, mediaId })
      } catch (error) {
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }

      return h.response(await getItemById(oldItem.id, req)).code(201)
    },
  },
  {
    method: 'DELETE',
    path: '/items/{id}',
    options: {
      description: 'Permet de supprimer un item',
      tags: ['api', 'jeux'],
      notes: [ROLES.reviewer],
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
  {
    method: 'GET',
    path: '/items/{id}/print/{type}',
    options: {
      description: 'la version imprimable d un item',
      tags: ['api', 'jeux'],
      notes: [ROLES.member],

      validate: {
        headers,
      },
    },
    async handler(req, h) {
      const { id, type } = req.params
      if (!id) return h.response({ error: 'Un id est requis' }).code(400)
      if (!type) return h.response({ error: 'Un type est requis' }).code(400)

      const item = await getItemById(id)
      if (!item) return h.response({ error: 'Non trouvé' }).code(404)

      try {
        const file = await printItem(item, type)
        return h.file(file)
      } catch (error) {
        console.log('PRINT ITEM :', error)
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }
    },
  },
  {
    method: 'POST',
    path: '/items/export',
    options: {
      description: 'Permet d exporter les items',
      tags: ['api', 'jeux'],
      notes: [ROLES.member],
      validate: {
        headers,
      },
    },

    async handler(req, h) {
      const { exportType, type, ids, format, selectedTotal } = JSON.parse(
        req.payload || '{}'
      )

      if (exportType === 'csv') {
        const items = await getItemsForExport({ type, ids })
        const csv = items
          .map((item) => {
            delete item.id
            return Object.values(item).join(',')
          })
          .join('\n')

        return h.response(csv).code(200).header('Content-Type', 'text/csv')
      }

      if (exportType === 'print') {
        let zipBuffer
        try {
          zipBuffer = await printItems({
            ids,
            format,
            type,
            selectedTotal,
          })
        } catch (error) {
          console.log('PRINT ITEMS :', error)
          return h
            .response({ error: 'Internal server error', details: error })
            .code(500)
        }

        return h
          .response(zipBuffer)
          .header('Content-Type', 'application/zip')
          .header('Content-Disposition', 'attachment; filename=export.zip')
          .code(200)
      }

      return h.response({ msg: 'ok' }).code(204)
    },
  },
]
