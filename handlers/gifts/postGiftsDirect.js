const { createGiftPack } = require('../../entities/gifts')
const { getGift_packIdDistribeType } = require('./getGift_packIdDistribeType')

async function postGiftsDirect(req, h) {
  const payload = JSON.parse(req.payload || '{}')

  if (!payload.email || !payload.numOfGifts)
    return h.response({ message: 'missing fields' }).code(400)

  try {
    const newGift = await createGiftPack({
      ...payload,
      campain: 'MO5 - Game Story',
      type: 'gsv',
      author_id: req.app.user.id,
      isSendOnDirect: true,
    })

    await getGift_packIdDistribeType(
      {
        params: {
          id: newGift.id,
          type: 'email',
        },
      },
      h,
      true
    )

    return h.response({ message: 'created' }).code(201)
  } catch (e) {
    console.error(e)
    return h.response({ message: 'error' }).code(500)
  }
}

module.exports = { postGiftsDirect }
