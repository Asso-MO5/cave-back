// constants.js
const TABLES = {
  tags: 'tags',
  medias: 'medias',
  authors: 'authors',
  messages: 'messages',

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
  cartel: {
    width: 800,
    height: 600,
    fontSize: 22,
    qrSize: 120,
  },
  'a3 paysage': {
    width: 420,
    height: 297,
    fontSize: 14,
    qrSize: 55,
  },
  rollup: {
    width: 297,
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
