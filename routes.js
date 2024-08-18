const routes = [
  {
    method: 'GET',
    path: '/',
    handler() {
      return 'API EN LIGNE'
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
  ...require('./ctrl/auth.ctrl'),
  ...require('./ctrl/items.ctrl'),
  ...require('./ctrl/companies.ctrl'),
  ...require('./ctrl/medias.ctrl'),
]

module.exports = { routes }
