const Joi = require('joi')
const { createMedia } = require('../entities/media')
const {
  createItems,
  ITEM_TYPE,
  getItemBySlug,
  getMachines,
  ITEMS,
} = require('../entities/items')
const { getAuthor } = require('../utils/get-author')
const { ROLES } = require('../utils/constants')
const { createItemCompany } = require('../entities/item-company')

module.exports = [
  {
    method: 'GET',
    path: '/machines',
    async handler(req, h) {
      await getAuthor(req, h, [ROLES.member])
      try {
        const query = await getMachines()
        return h.response(query).type('json')
      } catch (error) {
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }
    },
  },
  {
    method: 'GET',
    path: '/machines/{id}',
    async handler(req, h) {
      await getAuthor(req, h, [ROLES.member])

      console.log(req.server.info.uri)
      try {
        const machine = await getItemBySlug(req.params.id)
        if (!machine)
          return h.response({ error: 'Machine non trouvée' }).code(404)
        const m = Object.keys(ITEMS).reduce((acc, key) => {
          if (key === 'medias') {
            acc[key] = machine[key].map((i) => ({
              id: i.id,
              url: i.url,
              alt: i.alt,
            }))
          } else {
            acc[key] = machine[key]
          }
          return acc
        }, {})

        return h
          .response({
            ...m,
            cover_url: `${req?.server?.info?.uri}${machine.cover_url}`,
            manufacturer: {
              id: machine.manufacturer_id,
              name: machine.manufacturer_name,
            },
          })
          .type('json')
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
    path: '/machines',
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
