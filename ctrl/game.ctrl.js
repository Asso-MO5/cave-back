const Joi = require('joi')
const itemsHandler = require('../handlers/items.handler')
const { ROLES } = require('../utils/constants')
const itemHandler = require('../handlers/item.handler')
const { GAME_MODEL, GAMES_MODEL } = require('../models/game.model')
const { headers } = require('../models/header.model')

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
        }).label('GameListQuery'),
        headers,
      },
      response: {
        status: {
          200: GAMES_MODEL.required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/game/{slug}',
    handler: itemHandler,
    options: {
      description: 'Récupère un jeu par son slug',
      tags: ['api', 'jeux'],
      notes: [ROLES.member],
      validate: {
        headers,
      },
      response: {
        status: {
          200: GAME_MODEL.required(),
        },
      },
    },
  },
]
