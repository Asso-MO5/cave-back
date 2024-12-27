const { getGiftsByGiftPackId } = require('../../entities/gifts')

async function getGifts_pack(req, h) {
  const {
    page,
    limit = 100,
    order,
    sort,
    name,
    lastname,
    zipCode,
    status,
  } = req.query

  const { id } = req.params
  const offset = page ? (page - 1) * parseInt(limit) : 0

  const items = await getGiftsByGiftPackId({
    id,
    name,
    lastname,
    zipCode,
    status,
    limit: parseInt(limit),
    offset,
    order,
    sort,
  })
  return h.response(items).code(200)
}

module.exports = { getGifts_pack }
