const { headers } = require('../models/header.model')
const { ROLES } = require('../utils/constants')

const { postItems } = require('../handlers/items/postItems')
const { postItemsImport } = require('../handlers/items/postItemsImport')
const { getItemsHandler } = require('../handlers/items/getItems')
const { postItemsExport } = require('../handlers/items/postItemsExport')
const { putItemsId } = require('../handlers/items/putItemsId')
const { getItemsPublic } = require('../handlers/items/getItemsPublic')
const { putItemIdMedia } = require('../handlers/items/putItemIdMedia')
const { getItemsIdPrintType } = require('../handlers/items/getItemsIdPrintType')
const { postItemsExist } = require('../handlers/items/postItemsExist')
const { getItemPublicId } = require('../handlers/items/getItemPublicId')
const { getItemId } = require('../handlers/items/getItemId')
const {
  putItemIdStatusStatus,
} = require('../handlers/items/putItemIdStatusStatus')
const {
  deleteItemItemIdMediaMediaId,
} = require('../handlers/items/deleteItemItemIdMediaMediaId')
const { deleteItemsId } = require('../handlers/items/deleteItemsId')

module.exports = [
  {
    method: 'POST',
    path: '/items',
    options: {
      description: 'Permet de créer un item',
      tags: ['api', 'jeux'],
      notes: [ROLES.publisher, ROLES.reviewer],
      validate: {
        headers,
      },
    },
    handler: postItems,
  },
  {
    method: 'POST',
    path: '/items/import',
    options: {
      description: 'Permet d importer des items',
      tags: ['api', 'jeux'],
      notes: [ROLES.publisher, ROLES.reviewer],
      validate: {
        headers,
      },
    },
    handler: postItemsImport,
  },
  {
    method: 'GET',
    path: '/items',
    options: {
      description: 'Récupère la liste des items par type et recherche',
      tags: ['api', 'jeux'],
      notes: [ROLES.member],
      validate: {
        headers,
      },
    },
    handler: getItemsHandler,
  },
  {
    method: 'GET',
    path: '/items/public',
    options: {
      description: 'Récupère la liste des items par type et recherche',
      tags: ['api', 'jeux'],
      validate: {
        headers,
      },
    },
    handler: getItemsPublic,
  },
  {
    method: 'POST',
    path: '/items/exist',
    options: {
      description: 'Vérifie si un item existe',
      tags: ['api', 'jeux'],
      notes: [ROLES.publisher, ROLES.reviewer],
      validate: {
        headers,
      },
    },
    handler: postItemsExist,
  },
  {
    method: 'GET',
    path: '/item/public/{id}',
    options: {
      description: 'Récupère un item par son id',
      tags: ['api', 'jeux'],
    },
    handler: getItemPublicId,
  },
  {
    method: 'GET',
    path: '/item/{id}',
    options: {
      description: 'Récupère un item par son id',
      tags: ['api', 'jeux'],
      notes: [ROLES.member],
      validate: {
        headers,
      },
    },
    handler: getItemId,
  },
  {
    method: 'PUT',
    path: '/item/{id}',
    options: {
      description: 'Permet de modifier un item',
      tags: ['api', 'jeux'],
      notes: [ROLES.publisher, ROLES.reviewer],
      validate: {
        headers,
      },
    },
    handler: putItemsId,
  },
  {
    method: 'PUT',
    path: '/item/{id}/status/{status}',
    options: {
      description: "Permet de modifier le status d'un item",
      tags: ['api', 'jeux'],
      notes: [ROLES.publisher, ROLES.reviewer],
      validate: {
        headers,
      },
    },
    handler: putItemIdStatusStatus,
  },

  {
    method: 'PUT',
    path: '/item/{id}/media',
    options: {
      notes: [ROLES.reviewer, ROLES.publisher],
      description: 'Permet de mettre à jour le media d un item',
      tags: ['api', 'items'],
      payload: {
        parse: true,
        output: 'stream',
        multipart: true,
        maxBytes: 800 * 1024 * 1024, //800 mb
      },
    },
    handler: putItemIdMedia,
  },
  {
    method: 'DELETE',
    path: '/item/{itemId}/media/{mediaId}',
    options: {
      notes: [ROLES.reviewer, ROLES.publisher],
      description: 'Permet de supprimer un media d un item',
      tags: ['api', 'items'],
    },
    handler: deleteItemItemIdMediaMediaId,
  },
  {
    method: 'DELETE',
    path: '/items/{id}',
    options: {
      description: 'Permet de supprimer un item',
      tags: ['api', 'jeux'],
      notes: [ROLES.reviewer],
      validate: {
        headers,
      },
    },
    handler: deleteItemsId,
  },
  {
    method: 'GET',
    path: '/items/{id}/print/{type}',
    options: {
      description: 'la version imprimable d un item',
      tags: ['api', 'jeux'],
      notes: [ROLES.member],

      validate: {
        headers,
      },
    },
    handler: getItemsIdPrintType,
  },
  {
    method: 'POST',
    path: '/items/export',
    options: {
      description: 'Permet d exporter les items',
      tags: ['api', 'jeux'],
      notes: [ROLES.member],
      validate: {
        headers,
      },
    },
    handler: postItemsExport,
  },
]
