const { updateOrCreateMediaForItem } = require('../entities/item-medias')
const {
  createItemRelation,
  deleteItemRelationByLeftIdAndSameType,
} = require('../entities/item-relations')
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
  getItemsForExport,
  getSimilarItems,
} = require('../entities/items')
const { createMedia } = require('../entities/media')
const { headers } = require('../models/header.model')
const { ROLES } = require('../utils/constants')
const { getMediaFromUrl } = require('../utils/get-media-from-url')
const { getMediaUrl } = require('../utils/media-url')
const { printItem } = require('../utils/print-item')
const AdmZip = require('adm-zip')
const path = require('path')
const fs = require('fs')
const { createItemHistory } = require('../entities/item-history')

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
      const {
        type,
        search,
        searchBy,
        page,
        limit = 50,
        order,
        sort,
      } = req.query

      const offset = page ? (page - 1) * limit : 0
      const items = await getItems({
        type,
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
      if (payload.name) {
        const { type } = await getItemById(id)
        const existName = await getSimilarItems(payload.name, type, id)
        if (existName)
          return h
            .response({ error: 'Un item avec ce nom existe déjà' })
            .code(400)
      }
      await createItemHistory(id)

      const keys = Object.keys(payload).join(' ')

      if (keys.match(/var_|long_/)) {
        for (const key in payload) {
          // ----- VARCHAR -----
          if (key.match(/var_/))
            await createOrUpdateItemTextAttrs(
              id,
              key,
              payload[key],
              req.app.user
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

      await createItemHistory(id)
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

      await createItemHistory(id)
      try {
        //  await createItemHistory(oldItem.id)
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
            type: data.media,
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
            type: data.media,
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
            type: data.media,
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

      return h.response(await getItemById(req.params.id)).code(201)
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
      const { exportType, type, ids, format } = JSON.parse(req.payload || '{}')

      const items = await getItemsForExport({ type, ids })

      if (exportType === 'csv') {
        const csv = items
          .map((item) => {
            delete item.id
            return Object.values(item).join(',')
          })
          .join('\n')

        return h.response(csv).code(200).header('Content-Type', 'text/csv')
      }

      if (exportType === 'print') {
        const zip = new AdmZip()

        for (const item of items) {
          const filePath = await printItem(item, format) // Chemin du fichier généré
          const fileName = path.basename(filePath) // Nom du fichier sans le chemin
          const fileData = fs.readFileSync(filePath) // Lire le fichier généré

          zip.addFile(fileName, fileData) // Ajouter le fichier au ZIP
        }

        // Générer le fichier ZIP
        const zipBuffer = zip.toBuffer()

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
