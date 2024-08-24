const { ROLES } = require('./constants')

const routeDefs = {
  items: {
    path: '/items',
    get: {
      description: 'Récupère la liste des items (jeux, machines, listes, etc.)',
      roles: [ROLES.member],
    },
    post: {
      description: 'Permet de créer un item (jeu, machine, liste, etc.)',
      roles: [ROLES.reviewer, ROLES.publisher],
    },
  },
  item: {
    path: '/items/{slug}',
    get: {
      description:
        'Récupère un item (jeu, machine, liste, etc.) à partir de son slug',
      roles: [ROLES.member],
    },
    put: {
      description:
        'Permet de modifier un item (jeu, machine, liste, etc.), sauf le status',
      roles: [ROLES.reviewer, ROLES.publisher],
    },
    post: {
      description: 'Permet de créer un item (jeu, machine, liste, etc.)',
      roles: [ROLES.reviewer, ROLES.publisher],
    },
  },
  item_status: {
    path: '/items/{id}/status/{status}',
    put: {
      description:
        "Permet de changer le status (brouillon, en révision, publié ) d'un item (jeu, machine, liste, etc.)",
      roles: [ROLES.reviewer],
    },
  },
  machine_by_slug: {
    path: '/machines/{slug}',
    get: {
      description: 'Récupère une machine par son slug',
      roles: [ROLES.member],
    },
  },
  machine_game: {
    path: '/machine/{machine_id}/game/{ref_id}',
    put: {
      description:
        "Permet d'ajouter un jeu à une machine. Si le jeu n'a pas de machine associée, il ajoute la machine au jeu, sinon il créé un nouvel item du jeu associé à la machine",
      roles: [ROLES.reviewer, ROLES.publisher],
    },
  },
  companies_light: {
    path: '/companies/light',
    get: {
      description:
        'Récupère la liste des entreprises (éditeurs, distributeurs, etc.) en version light',
      roles: [ROLES.member],
    },
  },
  companies: {
    path: '/companies',
    get: {
      description:
        'Récupère la liste des entreprises (éditeurs, distributeurs, etc.)',
      roles: [ROLES.member],
    },
    post: {
      description:
        'Permet de créer une entreprise (éditeur, distributeur, etc.)',
      roles: [ROLES.reviewer, ROLES.publisher],
    },
  },
  medias_light: {
    path: '/medias/light',
    get: {
      description:
        'Récupère la liste des médias (magazines, sites, etc.) en version light',
      roles: [ROLES.member],
    },
  },
}

const getRoles = (path, method) => {
  return Object.keys(routeDefs).reduce((acc, key) => {
    if (routeDefs[key].path === path) {
      acc = routeDefs[key][method].roles
    }
    return acc
  }, [])
}

module.exports = { routeDefs, getRoles }
