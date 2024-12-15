const { getGiftByInfo, updateGift } = require('../../entities/gifts')

async function postGiftCheck(req, h) {
  const payload = JSON.parse(req.payload || '{}')

  try {
    const gift = await getGiftByInfo(payload)

    if (!gift) {
      return h
        .response({
          status: 'refused',
          message: 'Les informations ne correspondent pas à un cadeau',
        })
        .code(200)
    }

    const diffWithNow = new Date() - new Date(gift.updated_at)
    const diffWithNowInDays = diffWithNow / (1000 * 60 * 60 * 24)
    console.log(diffWithNowInDays)

    if (gift.status === 'distributed' && diffWithNowInDays > 0.005) {
      return h.response({
        status: 'refused',
        message: 'Le cadeau a déjà été distribué',
      })
    }

    await updateGift(gift.id, {
      updated_at: new Date(),
      status: 'distributed',
    })

    return h
      .response({
        message: 'Entrée autorisée',
        ...gift,
      })
      .code(200)
  } catch (e) {
    console.error(e)
    return h.response().code(500)
  }
}

module.exports = { postGiftCheck }
