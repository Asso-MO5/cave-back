const { knex } = require('../utils/db')
const { v4: uuidv4 } = require('uuid')
const { TABLES } = require('../utils/constants')

const ITEM_MEDIAS = {
  id: 'id',
  item_id: 'item_id',
  media_id: 'media_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
  author_id: 'author_id',
}

module.exports = {
  ITEM_MEDIAS,
}
