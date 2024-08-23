const jose = require('jose')

async function getAuthor(req, h, roles) {
  const secret = Buffer.from(process.env.API_KEY, 'hex')
  const jwt = req.headers.authorization.split(' ')[1]

  try {
    const { payload } = await jose.jwtDecrypt(jwt, secret)

    if (payload.iss !== 'cave_back' || payload.aud !== 'cave_front')
      return h.response({ msg: 'auth fail' }).type('json').code(401)

    if (roles && !roles.filter((role) => payload.roles.includes(role)).length) {
      return h.response({ msg: 'auth fail' }).type('json').code(401)
    }
    return payload
  } catch (error) {
    return h.response({ msg: 'auth fail' }).type('json').code(401)
  }
}

module.exports = { getAuthor }
