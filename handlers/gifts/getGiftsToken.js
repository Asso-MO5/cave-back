const jose = require('jose')
const { getGiftById } = require('../../entities/gifts')

async function getGiftToken(req, h) {
  const { token } = req.params

  const secret = Buffer.from(process.env.API_KEY, 'hex')
  try {
    const { payload } = await jose.jwtDecrypt(token, secret)

    if (payload.iss !== 'cave_front' || payload.aud !== 'cave_back')
      return h.response({ msg: 'auth fail' }).type('json').code(401)

    return h.response(await getGiftById(payload.id)).code(200)
  } catch (error) {
    console.error(error)
    return h.response({ msg: 'auth fail' }).type('json').code(401)
  }
}

module.exports = { getGiftToken }
