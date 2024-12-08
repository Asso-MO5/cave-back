'use strict'
require('dotenv').config()
const Hapi = require('@hapi/hapi')
const Nes = require('@hapi/nes')
const { routes } = require('./routes')
const { getAuthor } = require('./utils/get-author')
const Inert = require('@hapi/inert')
const Vision = require('@hapi/vision')
const HapiSwagger = require('hapi-swagger')
const Pack = require('./package')

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

  const swaggerOptions = {
    info: {
      title: 'CAVE API Documentation',
      version: Pack.version,
    },
    documentationPath: '/api-docs',
  }

  await server.register([
    Nes,
    Inert,
    Vision,
    {
      plugin: HapiSwagger,
      options: swaggerOptions,
    },
  ])

  // === Add routes ===
  server.route(routes)

  // === Subscribe to websocket ===
  server.subscription('/room/{id}')

  server.ext('onPreHandler', async (req, h) => {
    const authorizedRoles =
      routes.find(
        (r) =>
          r.path === req.route.path &&
          r.method.toLowerCase() === req.method.toLowerCase()
      )?.options?.notes || []

    if (authorizedRoles.length === 0) return h.continue

    // === RESTRICTED ROUTES ===
    if (authorizedRoles.includes('loot')) {
      const lootId = process.env.LOOT_ADMIN_ID?.split(',')

      const id = req.headers.authorization.split(' ')[1]

      if (id === 'null' || !id)
        return h
          .response({ message: "Vous n'avez pas les droits" })
          .code(403)
          .takeover()

      if (!lootId.includes(id)) {
        const user = await getAuthor(req, h, ['loot'])
        if (user) {
          req.app.user = user
          return h.continue
        }

        return h
          .response({ message: "Vous n'avez pas les droits" })
          .code(403)
          .takeover()
      } else {
        req.app.user = { roles: ['loot'], id }
        return h.continue
      }
    }

    const user = await getAuthor(req, h, authorizedRoles)

    const { roles } = user
    req.app.user = user

    const checkRoles = authorizedRoles.some((role) => roles.includes(role))
    return checkRoles
      ? h.continue
      : h
          .response({
            message:
              'Vous devez avoir une des rôles suivants: ' +
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
