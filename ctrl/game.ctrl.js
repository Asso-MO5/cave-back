const Joi = require('joi')
const itemsHandler = require('../handlers/items.handler')
const { ROLES } = require('../utils/constants')
const itemHandler = require('../handlers/item.handler')
const { GAME_MODEL } = require('../models/game.model')

module.exports = [
  {
    method: 'GET',
    path: '/games',
    handler: itemsHandler,
    options: {
      description: 'Récupère la liste des jeux',
      tags: ['api', 'jeux'],
      notes: [ROLES.member],
      validate: {
        query: Joi.object({
          limit: Joi.number().integer().min(1).max(100000).default(10),
        }),
        headers: Joi.object({
          authorization: Joi.string().required(),
        }).unknown(),
      },
      response: {
        status: {
          200: Joi.array().items(GAME_MODEL).required().label('Games'),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/game/{slug}',
    handler: itemHandler,
    options: {
      description: 'Récupère jeu par son slug',
      tags: ['api', 'jeux'],
      notes: [ROLES.member, ROLES.admin],
      validate: {
        headers: Joi.object({
          authorization: Joi.string().required(),
        }).unknown(),
      },
      response: {
        status: {
          200: GAME_MODEL.required(),
        },
      },
    },
  },
]
