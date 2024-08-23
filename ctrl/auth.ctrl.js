const jose = require('jose')
const { findOrCreateAuthor } = require('../entities/author')

module.exports = [
  {
    method: 'POST',
    path: '/auth/login',

    async handler(req, h) {
      const secret = Buffer.from(process.env.API_KEY, 'hex')

      try {
        const { payload } = await jose.jwtDecrypt(req.payload, secret)

        if (payload.iss !== 'cave_front' || payload.aud !== 'cave_back')
          return h.response({ msg: 'auth fail' }).type('json').code(401)

        const author = await findOrCreateAuthor({
          provider_id: payload.provider_id,
          name: payload.name,
        })

        const jwt = await new jose.EncryptJWT({
          id: author.id,
          roles: payload.roles,
        })
          .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
          .setIssuedAt()
          .setIssuer('cave_back')
          .setAudience('cave_front')
          .setExpirationTime('24h')
          .encrypt(secret)

        return h
          .response({
            auth: jwt,
          })
          .type('json')
          .code(200)
        //TODO save author in db
      } catch (error) {
        return h.response({ msg: 'auth fail' }).type('json').code(401)
      }
    },
  },
]
