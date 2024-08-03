'use strict'

const Hapi = require('@hapi/hapi')
const Nes = require('@hapi/nes')
const Inert = require('@hapi/inert')
const { routes } = require('./routes')

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

  await server.start()
  console.log('Server running on %s', server.info.uri)
}

process.on('unhandledRejection', (err) => {
  console.log(err)
  process.exit(1)
})

init()
