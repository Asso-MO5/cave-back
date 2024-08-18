const { knex } = require('../utils/db')
const { v4: uuidv4 } = require('uuid')
const { TABLES } = require('../utils/constants')

const ITEM_ITEMS = {
  id: 'id',
  item_id: 'item_id',
  item_left_id: 'item_left_id',
  item_right_id: 'item_right_id',
  relation_type: 'relation_type', // e.g., 'game-machine', 'list'...
  created_at: 'created_at',
  updated_at: 'updated_at',
  author_id: 'author_id',
}

module.exports = {
  ITEM_ITEMS,
}
