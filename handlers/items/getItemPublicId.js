const { getItems, getItemById } = require('../../entities/items')
const { getMediaUrl } = require('../../utils/media-url')

async function getItemPublicId(req, h) {
  const { id } = req.params

  if (!id) return h.response({ error: 'Un id est requis' }).code(400)

  if (id.includes('place_')) {
    const items = await getItems({
      place: id.replace('place_', ''),
      limit: 200,
    })
    return h.response(items).code(200)
  }

  const item = await getItemById(id)

  if (!item) return h.response({ error: 'Non trouvé' }).code(404)

  const relations = {}
  for (const relation of item.relations) {
    const rel = await getItemById(relation.id)
    relations[rel.type] = rel
  }

  return h
    .response({
      item: {
        ...item,
        ...relations,
        medias: item.medias.map((media) => ({
          ...media,
          url: getMediaUrl(media.url, req),
        })),
      },
    })
    .code(200)
}

module.exports = { getItemPublicId }
