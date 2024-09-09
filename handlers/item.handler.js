const { getMediaUrl } = require('../utils/media-url')
const { getItem } = require('./get-item')

module.exports = async (req, h) => {
  try {
    const item = await getItem(req.params.slug, req, h)

    if (item?.medias) {
      item.medias = item.medias.map((m) => {
        if (m.url) {
          m.url = getMediaUrl(m.url, req)
        }
        return m
      })
    }
    // legacy
    if (item?.cover_id) delete item.cover_id

    return h.response(item).type('json')
  } catch (error) {
    console.log('MACHINE GET BY ID :', error)
    return h
      .response({ error: 'Internal server error', details: error })
      .code(500)
  }
}
