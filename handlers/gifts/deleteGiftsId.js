const { deleteGiftsPack } = require('../../entities/gifts')

async function deleteGiftsId(req, h) {
  const { id } = req.params

  try {
    await deleteGiftsPack(id)
  } catch (e) {
    console.error(e)
    return h.response({ message: 'error' }).code(500)
  }

  return h.response({ message: 'ok' }).code(204)
}

module.exports = { deleteGiftsId }
