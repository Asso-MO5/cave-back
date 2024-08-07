const { knex } = require('../utils/db')
const { v4: uuidv4 } = require('uuid')
const { TABLES } = require('../utils/constants')

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

module.exports = {
  ITEMS,
  ITEMS_HISTORY,
  async createItems(item) {
    try {
      const id = uuidv4()
      await knex(TABLES.items).insert({
        id,
        ...item,
        created_at: new Date(),
        updated_at: new Date(),
      })
      return id
    } catch (error) {
      console.log('MEDIA CREATE :', error)
    }
  },
}
