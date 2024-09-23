const routes = [
  {
    method: 'GET',
    path: '/',
    handler(_, h) {
      return h?.redirect('/api-docs')
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
  ...require('./ctrl/companies.ctrl'),
  ...require('./ctrl/items.ctrl'),
  ...require('./ctrl/medias.ctrl'),
]

module.exports = { routes }
