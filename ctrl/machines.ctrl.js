const fs = require('fs')
const Joi = require('joi')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const { createMedia } = require('../entities/media')
const { createMachine } = require('../entities/machine')
module.exports = [
  {
    method: 'GET',
    path: '/machines',
    async handler(req, h) {
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

      const schema = Joi.object({
        name: Joi.string().required(),
        release_year: Joi.string().length(4),
        author_id: Joi.string().required(),
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
        medias: files,
      })

      if (error) return h.response({ error }).code(400)

      if (machine.cover_image) {
        await createMedia([machine.cover_image])
        machine.cover_image = '/uploads/' + machine.cover_image.hapi.filename
      }
      const mediasIds = await createMedia(files)

      try {
        const id = await createMachine(machine)
      } catch (error) {
        console.log('MACHINE CREATE :', error)
      }

      return h.response({ msg: 'OK' }).type('json').code(201)
    },
  },
]
