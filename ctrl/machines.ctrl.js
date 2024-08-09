const Joi = require('joi')
const { createMedia } = require('../entities/media')
const { createItems, ITEM_TYPE } = require('../entities/items')
const { getAuthor } = require('../utils/get-author')
const { ROLES } = require('../utils/constants')

module.exports = [
  {
    method: 'GET',
    path: '/machines',
    async handler(_req, h) {
      return h.response([]).type('json')
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
      })

      const files = Array.isArray(data.medias) ? data.medias : [data.medias]

      const { error, value: machine } = schema.validate({
        ...data,
        release_year: data.release_year || undefined,
        medias: files.filter((i) => i.hapi.filename),
      })

      if (error) {
        const details = error.details.map((i) => i.message).join(',')
        return h.response({ error: details }).code(400)
      }

      if (machine.cover_image) {
        machine.cover_image.alt = machine.name + ' cover'
        const coverIds = await createMedia([machine.cover_image])
        machine.cover_id = coverIds[0]
      }

      try {
        const newItem = await createItems({
          ...machine,
          author_id: author.id,
          type: ITEM_TYPE.machine,
        })
        return h
          .response({
            machine: newItem,
          })
          .type('json')
          .code(201)
      } catch (error) {
        console.log('MACHINE CREATE :', error)

        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }
    },
  },
]
