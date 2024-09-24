// constants.js
const TABLES = {
  tags: 'tags',
  medias: 'medias',
  authors: 'authors',

  // === ITEMS ===
  items: 'items',
  item_tags: 'item_tags',
  item_medias: 'item_medias',
  item_history: 'item_history',
  item_relation: 'item_relation',
  item_text_attrs: 'item_text_attrs',
  item_number_attrs: 'item_number_attrs',
  item_long_text_attrs: 'item_long_text_attrs',
}

const ROLES = {
  member: 'Membres MO5',
  admin: 'Master Control Program',
  reviewer: 'reviewer',
  publisher: 'publisher',
}

const METASEUR = 'https://metaseur-kazerlelutins-projects.vercel.app/api'
const FRONT_URL = 'https://cave.mo5.com/'

const SIZES = {
  a4: {
    width: 210,
    height: 297,
    fontSize: 13,
    qrSize: 50,
  },
  a5: {
    width: 148,
    height: 210,
    fontSize: 10,
    qrSize: 50,
  },
  'cartel machine': {
    width: 800,
    height: 600,
    fontSize: 22,
    qrSize: 120,
  },
  carte: {
    width: 85,
    height: 55,
    fontSize: 13,
    qrSize: 60,
  },
  rollup: {
    width: 850,
    height: 2000,
    fontSize: 20,
    qrSize: 100,
  },
}

module.exports = {
  TABLES,
  ROLES,
  METASEUR,
  FRONT_URL,
  SIZES,
}
