const { knex } = require('../utils/db')
const { v4: uuidv4 } = require('uuid')
const { TABLES } = require('../utils/constants')

const ITEM_HISTORY = {
  id: 'id',
  item_id: 'item_id',
  version: 'version',
  changes: 'changes', // JSON object containing the changes
  modified_at: 'modified_at',
  author_id: 'author_id',
}

module.exports = {
  ITEM_HISTORY,
}
