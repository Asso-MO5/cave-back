const Joi = require('joi')
const itemsHandler = require('../handlers/items.handler')
const { ROLES } = require('../utils/constants')
const { MACHINE_MODEL, MACHINES_MODEL } = require('../models/machine.model')
const { getMachinesByRefId } = require('../entities/items')
const { headers } = require('../models/header.model')
const itemHandler = require('../handlers/item.handler')

module.exports = [
  {
    method: 'GET',
    path: '/machines',
    handler: itemsHandler,
    options: {
      description: 'Récupère la liste des machines',
      tags: ['api', 'machine'],
      notes: [ROLES.member],
      validate: {
        query: Joi.object({
          limit: Joi.number().integer().min(1).max(100000).default(10),
        }).label('MachineListQuery'),
        headers,
      },
      response: {
        status: {
          200: MACHINES_MODEL.required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/machine/{slug}',
    handler: itemHandler,
    options: {
      description: 'Récupère une machine par son slug',
      tags: ['api', 'machine'],
      notes: [ROLES.member],
      validate: {
        headers,
      },
      response: {
        status: {
          200: MACHINE_MODEL.required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/machines/{id}',
    options: {
      description: 'Récupère une machine par son id',
      tags: ['api', 'machine'],
      notes: [ROLES.member],
      validate: {
        headers,
      },
      response: {
        status: {
          200: MACHINE_MODEL.required(),
        },
      },
    },
    async handler(req, h) {
      const query = await getMachinesByRefId(req.query.id)
      return h.response(query).type('json')
    },
  },
]
