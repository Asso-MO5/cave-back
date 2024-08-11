const Joi = require('joi')
const { getAuthor } = require('../utils/get-author')
const { paginateCursor } = require('../utils/db')
const { TABLES, ROLES } = require('../utils/constants')
const { createCompanies } = require('../entities/company')

module.exports = [
  {
    method: 'GET',
    path: '/companies',
    async handler(req, h) {
      await getAuthor(req, h, [ROLES.member])
      const query = await paginateCursor({
        tableName: TABLES.companies,
        pageSize: req.query.limit ? parseInt(req.query.limit) : 10,
        conditions: { type: ITEM_TYPE.machine },
        cursor: req.query.cursor,
      })

      return h.response(query).type('json')
    },
  },
  {
    method: 'POST',
    path: '/companies',
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
        borned_at: Joi.string(),
        description: Joi.string(),
        country: Joi.string(),
        activities: Joi.string(),
        logo_id: Joi.string(),
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

      const { error, value: company } = schema.validate({
        ...data,
        medias: files.filter((i) => i?.hapi?.filename),
      })

      if (error) {
        const details = error.details.map((i) => i.message).join(',')
        return h.response({ error: details }).code(400)
      }

      if (company.logo_id && company.logo_id?.hapi?.filename) {
        company.logo_id.alt = company.name + ' cover'
        const coverIds = await createMedia([company.logo_id])
        company.cover_id = coverIds[0]
      }

      try {
        const newItem = await createCompanies({
          ...company,
          author_id: author.id,
        })
        return h.response(newItem).type('json').code(201)
      } catch (error) {
        console.log('company CREATE :', error)

        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }
    },
  },
]
