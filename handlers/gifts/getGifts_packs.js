const { getGiftsPacks } = require('../../entities/gifts')

async function getGifts_packs(req, h) {
  const {
    page,
    limit = 100,
    order,
    sort,
    retailer,
    campain,
    type,
    status,
  } = req.query

  const offset = page ? (page - 1) * parseInt(limit) : 0

  const items = await getGiftsPacks({
    retailer,
    campain,
    type,
    status,
    limit: parseInt(limit),
    offset,
    order,
    sort,
    type,
  })
  return h.response(items).code(200)
}

module.exports = { getGifts_packs }
