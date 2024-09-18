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

module.exports = {
  TABLES,
  ROLES,
  METASEUR,
}
