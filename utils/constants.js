// constants.js
const TABLES = {
  tags: 'tags',
  medias: 'medias',
  authors: 'authors',
  // === COMPANIES ===
  companies: 'companies',
  item_companies: 'item_companies',
  // === ITEMS ===
  items: 'items',
  item_tags: 'item_tags',
  item_items: 'item_items',
  item_medias: 'item_medias',
  item_history: 'item_history',
  item_text_attrs: 'item_text_attrs',
  item_number_attrs: 'item_number_attrs',
  item_long_text_attrs: 'item_long_text_attrs',
  // === GAME MACHINE ===
  game_machines: 'game_machines',
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
