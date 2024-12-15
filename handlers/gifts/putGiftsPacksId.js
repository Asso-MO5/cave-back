const { updateGiftsPacksByGiftPackId } = require('../../entities/gifts')

async function putGiftsPacksId(req, h) {
  const { id } = req.params

  try {
    const newPack = await updateGiftsPacksByGiftPackId(
      id,
      JSON.parse(req.payload)
    )

    return h.response(newPack).code(204)
  } catch (e) {
    console.error(e)
    return h.response().code(500)
  }
}

module.exports = { putGiftsPacksId }
