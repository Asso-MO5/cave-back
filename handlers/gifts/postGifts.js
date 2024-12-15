const { createGiftPack } = require('../../entities/gifts')

async function postGifts(req, h) {
  const payload = JSON.parse(req.payload || '{}')

  if (
    !payload.retailer ||
    !payload.campain ||
    !payload.gift ||
    !payload.numOfGifts ||
    !payload.type
  ) {
    return h.response({ message: 'missing fields' }).code(400)
  }

  try {
    const newGift = await createGiftPack({
      ...payload,
      author_id: req.app.user.id,
    })

    return h.response(newGift).code(201)
  } catch (e) {
    console.error(e)
    return h.response({ message: 'error' }).code(500)
  }
}

module.exports = { postGifts }
