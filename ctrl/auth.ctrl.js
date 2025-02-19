//const jose = require('jose')
const { findOrCreateAuthor } = require('../entities/author')

module.exports = [
  {
    method: 'POST',
    path: '/auth/login',
    async handler(req, h) {
      const secret = Buffer.from(process.env.API_KEY, 'hex')
      /*
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
          .setExpirationTime('720h') // 30 jours = 720 heures
          .encrypt(secret)

        return h
          .response({
            auth: jwt,
          })
          .type('json')
          .code(200)
      } catch (error) {
        console.error(error)
        return h.response({ msg: 'auth fail' }).type('json').code(401)
      }

      */
      return h
        .response({
          auth: jwt,
        })
        .type('json')
        .code(200)
    },
  },
  {
    method: 'POST',
    path: '/auth/restricted',
    options: {
      description: "Permet de vérifier si l'utilisateur est authentifié",
      tags: ['api', 'auth'],
    },
    async handler(req, h) {
      const lootIdArray = process.env.LOOT_ADMIN_ID?.split(',')

      const { code } = JSON.parse(req.payload || '{}')

      if (!code || code === 'null')
        return h.response({ msg: 'auth fail' }).type('json').code(401)

      if (lootIdArray.includes(code))
        return h.response({ msg: 'exist' }).type('json').code(200)

      return h.response({ msg: 'auth fail' }).type('json').code(401)
    },
  },
]
