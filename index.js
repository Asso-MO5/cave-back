'use strict'
require('dotenv').config()
const Hapi = require('@hapi/hapi')
const Nes = require('@hapi/nes')
const Inert = require('@hapi/inert')
const { routes } = require('./routes')
const { getAuthor } = require('./utils/get-author')
const { ROLES } = require('./utils/constants')
const { getRoles } = require('./utils/auth')

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
    routes: {
      cors: {
        origin: ['*'],
        credentials: true,
        additionalHeaders: ['cache-control', 'x-requested-with'],
      },
    },
  })

  // === Register plugins ===
  await server.register(Nes)
  await server.register(Inert)

  // === Add routes ===
  server.route(routes)

  // === Subscribe to websocket ===
  server.subscription('/game/{id}')
  server.subscription('/machine/{id}')
  server.subscription('/public')
  server.subscription('/test')

  server.ext('onPreHandler', async (req, h) => {
    const authorizedRoles = getRoles(req.route.path, req.method)

    if (authorizedRoles.length === 0) return h.continue

    const user = await getAuthor(req, h, authorizedRoles)

    const { roles } = user
    req.app.user = user
    const checkRoles = authorizedRoles.some((role) => roles.includes(role))
    return checkRoles
      ? h.continue
      : h
          .response({
            message:
              'Vous devez avoir une res rôles suivants: ' +
              authorizedRoles.join(', '),
          })
          .code(401)
          .takeover()
  })
  await server.start()
  console.log('Server running on %s', server.info.uri)
}

process.on('unhandledRejection', (err) => {
  console.log(err)
  process.exit(1)
})

init()
