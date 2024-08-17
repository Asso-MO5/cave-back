const Joi = require('joi')
const { createMedia, getMediasByItemId } = require('../entities/media')
const {
  createItems,
  getItemBySlug,
  getItemById,
  getItems,
  getItemByNameAndType,
  updateItem,
} = require('../entities/items')
const { getAuthor } = require('../utils/get-author')
const { ROLES } = require('../utils/constants')
const { getMediaUrl } = require('../utils/media-url')
const { getCompaniesByItemId } = require('../entities/company')
const { createItemHistory } = require('../entities/item-history')
const {
  replaceCompany,
  replaceCompanyForItem,
} = require('../entities/item-company')

module.exports = [
  {
    method: 'GET',
    path: '/items',
    async handler(req, h) {
      await getAuthor(req, h, [ROLES.member])
      const items = []

      try {
        const query = await getItems(req.query.type)
        items.push(...query)
      } catch (error) {
        console.log('GET ITEMS :', error)
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }

      if (req.query.type === 'machine') {
        return h
          .response(
            items.map((m) => {
              return {
                slug: m.slug,
                name: m.name,
                manufacturer: m.manufacturer_name,
                release_year: m.release_year,
              }
            })
          )
          .type('json')
      }

      return h.response(items).type('json')
    },
  },
  {
    method: 'GET',
    path: '/items/{slug}',
    async handler(req, h) {
      await getAuthor(req, h, [ROLES.member])

      try {
        const item = await getItemBySlug(req.params.slug)
        if (!item) return h.response({ error: 'Non trouvé' }).code(404)

        // ====== MEDIAS ========================

        if (item.cover_url) {
          item.cover_url = getMediaUrl(item.cover_url, req)
        }

        try {
          item.medias = await getMediasByItemId(item.id)
        } catch (error) {
          console.log('ITEM MEDIAS GET BY ID :', error)
          return h
            .response({ error: 'Internal server error', details: error })
            .code(500)
        }

        // ====== COMPANY ========================
        try {
          const companies = await getCompaniesByItemId(item.id)
          companies.forEach((c) => {
            item[c.relation_type] = c
          })
        } catch (error) {
          console.log('ITEM COMPANY GET BY ID :', error)
          return h
            .response({ error: 'Internal server error', details: error })
            .code(500)
        }

        return h.response(item).type('json')
      } catch (error) {
        console.log('MACHINE GET BY ID :', error)
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
      payload: {
        parse: true,
        output: 'stream',
        multipart: true,
        maxBytes: 800 * 1024 * 1024, //800 mb
      },
    },
    async handler(req, h) {
      const author = await getAuthor(req, h, [ROLES.member])

      const schema = Joi.object({
        name: Joi.string().required(),
      })

      const { error, value: machine } = schema.validate(req.payload)

      if (error) {
        const details = error.details.map((i) => i.message).join(',')
        return h.response({ error: details }).code(400)
      }

      const ifMachineExist = await getItemByNameAndType(
        machine.name,
        req.query.type
      )

      if (ifMachineExist)
        return h.response({ error: 'Machine déjà existante' }).code(400)

      try {
        const newItem = await createItems({
          ...machine,
          author_id: author.id,
          type: req.query.type,
        })

        return h.response(newItem).type('json').code(201)
      } catch (error) {
        console.log('MACHINE CREATE :', error)

        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }
    },
  },

  {
    method: 'PUT',
    path: '/items/{id}',
    options: {
      payload: {
        parse: true,
        output: 'stream',
        multipart: true,
        maxBytes: 800 * 1024 * 1024, //800 mb
      },
    },
    async handler(req, h) {
      const data = req.payload
      const author = await getAuthor(req, h, [ROLES.member])

      const oldItem = await getItemById(req.params.id)
      if (!oldItem) return h.response({ error: 'Non trouvé' }).code(404)

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
            author_id: author.id,
          })
        } catch (error) {
          return h
            .response({ error: 'Internal server error', details: error })
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
              author.id
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
          author_id: author.id,
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
]
