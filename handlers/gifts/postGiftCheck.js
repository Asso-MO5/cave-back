const { getGiftByInfo, updateGift } = require('../../entities/gifts')

async function postGiftCheck(req, h) {
  const payload = JSON.parse(req.payload || '{}')

  try {
    const gift = await getGiftByInfo(payload)

    if (!gift) {
      return h
        .response({
          status: 'refused',
          message: 'Les informations ne correspondent pas à un pass MO5',
        })
        .code(200)
    }

    if (gift.status === 'distributed') {
      return h.response({
        message: 'Le pass a déjà été distribué',
        ...gift,
        status: 'already_distributed',
      })
    }

    const changes = {
      status: 'distributed',
      updated_at: new Date(),
    }

    await updateGift(gift.id, changes)

    return h
      .response({
        message: 'Entrée autorisée',
        ...gift,
        ...changes,
      })
      .code(200)
  } catch (e) {
    console.error(e)
    return h.response().code(500)
  }
}

module.exports = { postGiftCheck }
