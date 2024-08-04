const fs = require('fs')
const Joi = require('joi')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
module.exports = [
  {
    method: 'GET',
    path: '/companies',
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
        year: Joi.string().length(4),
        description: Joi.string(),
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
      const { error, value } = schema.validate({
        ...data,
        medias: files,
      })

      if (error) return h.response({ error }).code(400)

      const dir = path.join(__dirname, '../uploads')

      if (!fs.existsSync(dir)) fs.mkdirSync(dir)

      const filesToSave = []
      for (const file of files) {
        const extension = path.extname(file.hapi.filename)
        const id = uuidv4()
        const uuidName = id + extension
        const destination = path.join(dir, uuidName)
        const fileStream = fs.createWriteStream(destination)

        await new Promise((resolve, reject) => {
          file.pipe(fileStream)

          file.on('end', resolve)
          file.on('error', reject)
          filesToSave.push({
            id,
            name: file.hapi.filename.split('.')[0],
            size: file._data.length,
            type: file.hapi.headers['content-type'],
            url: `/uploads/${uuidName}`,
          })
        })
      }
      return h.response({ msg: 'OK' }).type('json').code(201)
    },
  },
]
