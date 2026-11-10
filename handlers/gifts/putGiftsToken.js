const jose = require('jose')
const { getGiftById, updateGift } = require('../../entities/gifts')
const { mail } = require('../../utils/mail')
const { FROM } = require('../../utils/constants')

async function putGiftToken(req, h) {
  const { token } = req.params

  const payload = JSON.parse(req.payload || '{}')
  const secret = Buffer.from(process.env.API_KEY, 'hex')
  let id = null
  try {
    const { payload } = await jose.jwtDecrypt(token, secret)

    if (payload.iss !== 'cave_front' || payload.aud !== 'cave_back')
      return h.response({ msg: 'auth fail' }).type('json').code(401)

    id = payload.id
  } catch (error) {
    console.error(error)
    return h.response({ msg: 'auth fail' }).type('json').code(401)
  }

  const gift = await getGiftById(id)

  const newEmail = payload.email

  const newGift = {
    ...gift,
    ...payload,
  }
  try {
    await updateGift(id, newGift)
  } catch (e) {
    console.error(e)
    return h.response().code(500)
  }

  if (newEmail) {
    await mail.sendMail({
      to: newEmail,
      subject: 'Association MO5, confirmation Pass "Game Story" Versailles',
      text: `
      Ces informations serviront uniquement à l'accueil de Game Story, pour autoriser l'entrée.

      Information à donner à l'accueil: 
        - Nom: ${newGift.name}
        - Prénom: ${newGift.lastname}
        - Code postal: ${newGift.zipCode}

        N'oubliez pas de réserver votre date et horaire de visite, en choisissant "Entrée gratuite"
        https://www.billetweb.fr/game-story

        Ne pas répondre à cet email.

        Modifier vos informations: ${process.env.FRONT_URL}/gifts/${token}
      `,
      // html: 'Vos cadeaux',
      from: `💾🖱️🎮 Association MO5 | Game Story Versailles <${process.env.MAIL_ADDRESS}>`,
    })
  }
  return h.response().code(204)
}

module.exports = { putGiftToken }
