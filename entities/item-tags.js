const { knex } = require('../utils/db')
const { v4: uuidv4 } = require('uuid')
const { TABLES } = require('../utils/constants')

const ITEM_TAGS = {
  id: 'id',
  item_id: 'item_id',
  tag_id: 'tag_id',
  author_id: 'author_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
}

module.exports = {
  ITEM_TAGS,
}
