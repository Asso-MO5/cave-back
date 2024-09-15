const { getMedias, createMedia, deleteMedia } = require('../entities/media')
const { MEDIAS_MODEL, MEDIA_MODEL } = require('../models/media.model')
const { ROLES } = require('../utils/constants')
const { headers } = require('../models/header.model')
const { getMediaUrl } = require('../utils/media-url')
const Joi = require('joi')
const { getMediaFromUrl } = require('../utils/get-media-from-url')

module.exports = [
  {
    method: 'GET',
    path: '/medias/light',
    options: {
      description: 'Récupère la liste des medias',
      tags: ['api', 'medias'],
      notes: [ROLES.member],
      validate: {
        headers,
      },
    },
    async handler(req, h) {
      try {
        const query = await getMedias(req?.query?.search)

        const medias = query.map((m) => ({
          id: m.id,
          name: m.name,
          type: m.type,
          total_usage_count: m.total_usage_count,
          url: getMediaUrl(m.url, req),
        }))

        const { error } = MEDIAS_MODEL.validate(medias)

        if (error)
          return h.response({ error: 'Bad request', details: error }).code(400)

        return h.response(medias).type('json')
      } catch (error) {
        console.log('GET MEDIAS :', error)
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }
    },
  },
  {
    method: 'POST',
    path: '/medias',
    options: {
      payload: {
        parse: true,
        output: 'stream',
        multipart: true,
        maxBytes: 800 * 1024 * 1024, //800 mb
      },
      description: 'Permet de créer un media',
      tags: ['api', 'medias'],
      notes: [ROLES.publisher, ROLES.reviewer],
      validate: {
        headers,
      },
    },
    async handler(req, h) {
      let file = req.payload?.file
      if (req.payload?.url) {
        console.log('req.payload.url :', req.payload.url)
        file = await getMediaFromUrl(req.payload.url)
      }

      try {
        const medias = await createMedia([file])

        const { error } = MEDIA_MODEL.validate(medias[0])
        if (error)
          return h.response({ error: 'Bad request', details: error }).code(400)
        return h.response(medias[0]).code(201)
      } catch (error) {
        console.log('CREATE MEDIA :', error)
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }
    },
  },
  {
    method: 'DELETE',
    path: '/medias/{id}',
    options: {
      description: 'Supprime un media',
      tags: ['api', 'medias'],
      notes: [ROLES.publisher, ROLES.reviewer],
      validate: {
        headers,
      },
      response: {
        status: {
          204: Joi.object({
            message: Joi.string().required(),
          })
            .label('DeleteMediaModel')
            .required(),
        },
      },
    },
    async handler(req, h) {
      try {
        await deleteMedia(req.params.id)
        return h
          .response({
            message: 'Media deleted',
          })
          .code(204)
      } catch (error) {
        console.log('DELETE MEDIA :', error)
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }
    },
  },
]
