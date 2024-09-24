const { getCompanyById } = require('../entities/company')
const { createItemHistory } = require('../entities/item-history')
const { updateOrCreateMediaForItem } = require('../entities/item-medias')
const {
  getCompanies,
  getItemById,
  createOrUpdateItemTextAttrs,
  createOrUpdateItemLongTextAttrs,
  updateItem,
} = require('../entities/items')
const { createMedia } = require('../entities/media')
const { headers } = require('../models/header.model')
const { ROLES } = require('../utils/constants')
const { getMediaFromUrl } = require('../utils/get-media-from-url')
const { getMediaUrl } = require('../utils/media-url')

module.exports = [
  {
    method: 'GET',
    path: '/companies',

    options: {
      description: 'Récupère la liste des entreprises',
      tags: ['api', 'entreprises'],
      notes: [ROLES.member],
      validate: {
        headers,
      },
    },
    async handler(req, h) {
      const { search, searchBy, page, limit = 50, order, sort } = req.query

      const offset = page ? (page - 1) * limit : 0

      const items = await getCompanies({
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
    path: '/companies/{id}',
    options: {
      description: 'Récupère une entreprise',
      tags: ['api', 'entreprises'],
      notes: [ROLES.member],
      validate: {
        headers,
      },
    },
    async handler(req, h) {
      const { id } = req.params
      const company = await getCompanyById(id)
      return h
        .response({
          ...company,
          medias: company.medias.map((media) => ({
            ...media,
            url: getMediaUrl(media.url, req),
          })),
        })
        .code(201)
    },
  },
  {
    method: 'PUT',
    path: '/companies',
    options: {
      description: 'Met à jour une entreprise',
      tags: ['api', 'entreprises'],
      notes: [ROLES.admin],
      validate: {
        headers,
      },
    },
    async handler(req, h) {
      const { ids, body: payload } = JSON.parse(req.payload || '{}')

      for (const id of ids) {
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
        } else {
          // ----- ITEM -----
          await updateItem(id, payload)
        }
      }
      const company = await getCompanyById(ids[0])
      return h
        .response({
          ...company,
          medias: company.medias.map((media) => ({
            ...media,
            url: getMediaUrl(media.url, req),
          })),
        })
        .code(204)
    },
  },
  {
    method: 'PUT',
    path: '/company/{id}/media',
    options: {
      notes: [ROLES.reviewer, ROLES.publisher],
      description: 'Permet de mettre à jour le media d une company',
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
      const baseCompany = await getCompanyById(req.params.id)
      if (!baseCompany) return h.response({ error: 'Non trouvé' }).code(404)

      const type = data.create ? `${data.media}-${uuidv4()}` : data.media

      const ids = baseCompany.alternatives.map((alt) => alt.id)
      try {
        for (const id of ids) {
          await createItemHistory(id, req.app.user.id)
        }
      } catch (error) {
        console.log('ITEM HISTORY :', error)
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }

      if (data.file && data.file?.hapi?.filename) {
        const [{ id: mediaId }] = await createMedia([data.file])

        try {
          for (const id of ids) {
            await updateOrCreateMediaForItem({
              itemId: id,
              mediaId,
              authorId: req.app.user.id,
              type,
            })
          }
        } catch (error) {
          return h
            .response({ error: 'Internal server error', details: error })
            .code(500)
        }
      }

      if (data.id) {
        try {
          for (const id of ids) {
            await updateOrCreateMediaForItem({
              itemId: id,
              mediaId: data.id,
              authorId: req.app.user.id,
              type,
            })
          }
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
          for (const id of ids) {
            await updateOrCreateMediaForItem({
              itemId: id,
              mediaId,
              authorId: req.app.user.id,
              type,
            })
          }
        } catch (error) {
          return h
            .response({
              error: 'Internal server error',
              details: error,
            })
            .code(500)
        }
      }
      const newCompany = await getCompanyById(req.params.id)

      return h
        .response({
          ...newCompany,
          medias: newCompany.medias.map((media) => ({
            ...media,
            url: getMediaUrl(media.url, req),
          })),
        })
        .code(201)
    },
  },
  {
    method: 'PUT',
    path: '/company/{id}/status/{status}',
    options: {
      description: "Permet de modifier le status d'une entreprise",
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

      const baseCompany = await getCompanyById(req.params.id)
      if (!baseCompany) return h.response({ error: 'Non trouvé' }).code(404)

      const ids = baseCompany.alternatives.map((alt) => alt.id)

      for (const id of ids) {
        await createItemHistory(id, req.app.user.id)
        await updateItem(id, { status })
      }

      const newCompany = await getCompanyById(id)

      return h
        .response({
          ...newCompany,
          medias: newCompany.medias.map((media) => ({
            ...media,
            url: getMediaUrl(media.url, req),
          })),
        })
        .code(201)
    },
  },
]
