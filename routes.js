const {
  getGift_packIdDistribeType,
} = require('./handlers/gifts/getGift_packIdDistribeType')

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
    path: '/test',
    handler(_, h) {
      h.response({ msg: 'exist', link: process.env.FRONT_URL })
        .type('json')
        .code(200)
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
  {
    method: 'GET',
    path: '/test/{id}/{type}',
    handler: getGift_packIdDistribeType,
  },
  ...require('./ctrl/auth.ctrl'),
  ...require('./ctrl/companies.ctrl'),
  ...require('./ctrl/items.ctrl'),
  ...require('./ctrl/medias.ctrl'),
  ...require('./ctrl/messages.ctrl'),
  ...require('./ctrl/gifts.ctrl'),
]

module.exports = { routes }
