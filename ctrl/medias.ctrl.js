const { getMedias } = require('../entities/media')
const { getMediaUrl } = require('../utils/media-url')

module.exports = [
  {
    method: 'GET',
    path: '/medias/light',
    async handler(req, h) {
      const query = await getMedias(req.query.search)
      return h
        .response(
          query.map((m) => ({
            ...m,
            url: getMediaUrl(m.url, req),
          }))
        )
        .type('json')
    },
  },
]
