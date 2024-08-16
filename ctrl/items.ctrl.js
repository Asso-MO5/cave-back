const Joi = require('joi')
const { createMedia, getMediasByItemId } = require('../entities/media')
const {
  createItems,
  ITEM_TYPE,
  getItemBySlug,
  ITEMS,
  getItemById,
  getItems,
  getItemByNameAndType,
  updateItem,
} = require('../entities/items')
const { getAuthor } = require('../utils/get-author')
const { ROLES } = require('../utils/constants')
const {
  createItemCompany,
  getItemCompanyByItemId,
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
          item.cover_url = item.cover_url.includes('http')
            ? item.cover_url
            : req.server.info.protocol + '://' + req.info.host + item.cover_url
        }

        const medias = await getMediasByItemId(item.id)
        item.medias = medias || []
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
          type: ITEM_TYPE.machine,
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
    method: 'POST',
    path: '/itemdcss',
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

      const schema = Joi.object({
        name: Joi.string().required(),
        release_year: Joi.string().length(4),
        description: Joi.string(),
        cover_image: Joi.object().unknown(true),
        additionnal_information: Joi.string(),
        manufacturer: Joi.string(),
        medias: Joi.array().items(
          Joi.object().keys({
            hapi: Joi.object()
              .keys({
                filename: Joi.string().required(),
              })
              .unknown(true),
            _readableState: Joi.object().unknown(true),
            _events: Joi.object().unknown(true),
            _eventsCount: Joi.number(),
            _maxListeners: Joi.number(),
            _data: Joi.object().unknown(true),
            _position: Joi.number(),
            _writableState: Joi.object().unknown(true),
            writable: Joi.boolean(),
            readable: Joi.boolean(),
            domain: Joi.object().unknown(true),
            _encoding: Joi.string(),
          })
        ),
        medias_url: Joi.string(),
      })

      const files = Array.isArray(data.medias) ? data.medias : [data.medias]

      const { error, value: machine } = schema.validate({
        ...data,
        medias: files.filter((i) => i?.hapi?.filename),
      })

      if (error) {
        const details = error.details.map((i) => i.message).join(',')
        return h.response({ error: details }).code(400)
      }

      console.log('machine :', machine.name, req.query)
      const ifMachineExist = await getItemByNameAndType(
        machine.name,
        req.query.type
      )
      if (ifMachineExist)
        return h.response({ error: 'Machine déjà existante' }).code(400)

      if (machine.cover_image && machine.cover_image?.hapi?.filename) {
        machine.cover_image.alt = machine.name + ' cover'
        const coverIds = await createMedia([machine.cover_image])
        machine.cover_id = coverIds[0]
      }

      try {
        const newItem = await createItems({
          ...machine,
          manufacturer: undefined,
          author_id: author.id,
          type: ITEM_TYPE.machine,
        })

        await createItemCompany({
          item_id: newItem.id,
          company_id: machine.manufacturer,
          relation_type: 'manufacturer',
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

        oldItem.cover_url = cover.url.includes('http')
          ? cover.url.cover_url
          : req.server.info.protocol + '://' + req.info.host + cover.url

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
      // ====== MEDIAS =========================================================

      const files = Array.isArray(data.medias) ? data.medias : [data.medias]

      const { error, value: machine } = schema.validate({
        ...data,
        medias: files.filter((i) => i?.hapi?.filename),
      })

      if (error) {
        const details = error.details.map((i) => i.message).join(',')
        return h.response({ error: details }).code(400)
      }

      if (machine.cover_image && machine.cover_image?.hapi?.filename) {
        machine.cover_image.alt = machine.name + ' cover'
        const coverIds = await createMedia([machine.cover_image])
        machine.cover_id = coverIds[0]
      }

      try {
        const newItem = await createItems({
          ...machine,
          manufacturer: undefined,
          author_id: author.id,
          type: ITEM_TYPE.machine,
        })

        await createItemCompany({
          item_id: newItem.id,
          company_id: machine.manufacturer,
          relation_type: 'manufacturer',
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
]
