const { deleteGiftsId } = require('../handlers/gifts/deleteGiftsId')
const {
  getGift_packIdDistribeType,
} = require('../handlers/gifts/getGift_packIdDistribeType')
const { getGifts_packs } = require('../handlers/gifts/getGifts_packs')
const { postGifts } = require('../handlers/gifts/postGifts')
const { headers } = require('../models/header.model')
const { ROLES } = require('../utils/constants')

module.exports = [
  {
    method: 'POST',
    path: '/gifts_packs',
    options: {
      description: 'Permet de créer un pack de gifts',
      tags: ['api', 'gifts'],
      notes: [ROLES.gameStoryManager],
      validate: {
        headers,
      },
    },
    handler: postGifts,
  },
  {
    method: 'GET',
    path: '/gifts_packs',

    options: {
      description: 'Récupère la liste des packs de gifts',
      tags: ['api', 'gifts'],
      notes: [ROLES.gameStoryManager],
      validate: {
        headers,
      },
    },
    handler: getGifts_packs,
  },
  {
    method: 'GET',
    path: '/gifts_packs/{id}/distribe/{type}',

    options: {
      description: 'Récupère la liste des packs de gifts',
      tags: ['api', 'gifts'],
      notes: [ROLES.gameStoryManager],
      validate: {
        headers,
      },
    },
    handler: getGift_packIdDistribeType,
  },
  {
    method: 'DELETE',
    path: '/gifts_packs/{id}',
    options: {
      description: 'Supprime un pack de gifts',
      tags: ['api', 'loots'],
      notes: [ROLES.gameStoryManager],
      validate: {
        headers,
      },
    },
    handler: deleteGiftsId,
  },
]
