const { routeDefs } = require('./utils/auth')

const routes = [
  {
    method: 'GET',
    path: '/',
    handler(_, h) {
      return h?.response(routeDefs).type('json').code(200)
    },
  },
  {
    method: 'GET',
    path: '/uploads/{param*}',
    handler: {
      directory: {
        path: 'uploads',
        index: false,
      },
    },
  },
  ...require('./ctrl/swagger.ctrl'),
  ...require('./ctrl/auth.ctrl'),
  ...require('./ctrl/items.ctrl'),
  ...require('./ctrl/companies.ctrl'),
  ...require('./ctrl/medias.ctrl'),
]

module.exports = { routes }
