const { knex } = require('../utils/db')
const { v4: uuidv4 } = require('uuid')
const { TABLES } = require('../utils/constants')
const { getSlug } = require('../utils/get-slug')

const ITEMS = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  release_year: 'release_year',
  description: 'description',
  type: 'type', // e.g., 'item', 'game'
  cover_id: 'cover_id',
  author_id: 'author_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
}

const ITEMS_HISTORY = {
  ...ITEMS,
  machine_id: 'machine_id',
  medias: 'medias',
  version: 'version',
  modified_at: 'modified_at',
}

const ITEM_TYPE = {
  obj: 'obj',
  game: 'game',
  machine: 'machine',
}

module.exports = {
  ITEMS,
  ITEMS_HISTORY,
  ITEM_TYPE,

  async createItems(item) {
    try {
      const id = uuidv4()
      const newItem = {
        id,
        name: item.name,
        type: item.type || 'item',
        cover_id: item.cover_id || null,
        author_id: item.author_id,
        description: item.description || null,
        slug: getSlug(item.name),
        created_at: new Date(),
        updated_at: new Date(),
      }
      await knex(TABLES.items).insert(newItem)

      return {
        ...newItem,
        description: item.description,
      }
    } catch (error) {
      console.log('MEDIA CREATE :', error)
    }
  },
}
