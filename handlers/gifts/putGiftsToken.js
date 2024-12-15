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
    //TODO ici on envoi le pdf par mail
    //et les infos recap
    await mail.sendMail({
      to: newEmail,
      subject: 'Votre cadeaux',
      text: `
      Information à donner à l'accueil: 
        - Votre nom: ${newGift.name}
        - Votre email: ${newGift.email}
        - votre date de naissance: ${new Date(
          newGift.birthdate
        ).toLocaleDateString()}

        Lien pour modifier vos information: ${
          process.env.FRONT_URL
        }/gifts/${token}
      `,
      // html: 'Vos cadeaux',
      from: FROM,
    })
  }
  return h.response().code(204)
}

module.exports = { putGiftToken }
