const Joi = require('joi')
const itemsHandler = require('../handlers/items.handler')
const { ROLES } = require('../utils/constants')
const { headers } = require('../models/header.model')
const { EXPOS_MODEL, EXPO_MODEL } = require('../models/expo.model')
const itemHandler = require('../handlers/item.handler')
const {
  CARTELS_MODEL,
  CARTEL_CREATE_PAYLOAD_MODEL,
} = require('../models/cartels.model')
const {
  getItemById,
  getItemBySlug,
  createItems,
  getCartelByExpoId,
} = require('../entities/items')
const { ITEM_MODEL } = require('../models/item.model')
const { createRelation } = require('../entities/item-items')

module.exports = [
  {
    method: 'GET',
    path: '/expos',
    handler: itemsHandler,
    options: {
      description: 'Récupère la liste des expositions',
      tags: ['api', 'expo'],
      notes: [ROLES.member],
      validate: {
        query: Joi.object({
          limit: Joi.number().integer().min(1).max(100000).default(10),
        }).label('ExpoListQuery'),
        headers,
      },
      response: {
        status: {
          200: EXPOS_MODEL.required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/expos/{slug}',
    handler: itemHandler,
    options: {
      description: 'Récupère une expo par son slug',
      tags: ['api', 'expo'],
      notes: [ROLES.member],
      validate: {
        headers,
      },
      response: {
        status: {
          200: EXPO_MODEL.required(),
        },
      },
    },
  },

  // ======|| CARTELS ||================================================================================================
  {
    method: 'GET',
    path: '/expos/{expoId}/cartels',

    options: {
      description: "Récupère la liste des cartels d'une exposition",
      tags: ['api', 'expo'],
      notes: [ROLES.member],
      validate: {
        headers,
      },
      response: {
        status: {
          200: CARTELS_MODEL.required(),
        },
      },
    },
    async handler(req, h) {
      const cartels = await getCartelByExpoId(req.params.expoId)

      return h.response(cartels).type('json').code(200)
    },
  },
  {
    method: 'POST',
    path: '/expos/{expoId}/cartels',

    options: {
      description: "Récupère la liste des cartels d'une exposition",
      tags: ['api', 'expo'],
      notes: [ROLES.member],
      validate: {
        payload: CARTEL_CREATE_PAYLOAD_MODEL,
        headers,
      },
      response: {
        status: {
          200: ITEM_MODEL.required(),
        },
      },
    },
    async handler(req, h) {
      const { error } = CARTEL_CREATE_PAYLOAD_MODEL.validate(req.payload)
      if (error) {
        console.error('error', error)
        return h.response({ message: error.message }).code(400)
      }
      const { slug, name } = req.payload

      const expo = await getItemById(req.params.expoId)

      if (slug) {
        const item = await getItemBySlug(slug)

        const cartel = await createItems({
          name: item.name,
          type: 'cartel',
          author_id: req.app.user.id,
        })
        // RefId = Item de base, RightID = Cartel, LeftID = Expo
        await createRelation(
          item.id,
          cartel.id,
          expo.id,
          'cartel',
          req.app.user.id
        )
        const newCartel = await getItemById(cartel.id)

        return h.response(newCartel).type('json')
      }
      if (name) {
        //TODO créer un nouvelle items de base puis créer le cartel
      }
      return h.response({}).type('json')
    },
  },
]
