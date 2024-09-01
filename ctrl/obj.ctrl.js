const itemsHandler = require('../handlers/items.handler')
const itemHandler = require('../handlers/item.handler')
const { ROLES } = require('../utils/constants')
const { headers } = require('../models/header.model')
const {
  OBJS_QUERY_MODEL,
  OBJS_MODEL,
  OBJ_MODEL,
} = require('../models/obj.model')

module.exports = [
  {
    method: 'GET',
    path: '/objs',
    handler: itemsHandler,
    options: {
      description: 'Récupère la liste des objets',
      tags: ['api', 'objets'],
      notes: [ROLES.member],
      validate: {
        query: OBJS_QUERY_MODEL,
        headers,
      },
      response: {
        status: {
          200: OBJS_MODEL.required(),
        },
      },
    },
  },

  {
    method: 'GET',
    path: '/obj/{slug}',
    handler: itemHandler,
    options: {
      description: 'Récupère un objet par son slug',
      tags: ['api', 'objets'],
      notes: [ROLES.member],
      validate: {
        headers,
      },
      response: {
        status: {
          200: OBJ_MODEL.required(),
        },
      },
    },
  },
]
