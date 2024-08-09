const { knex } = require('../utils/db')
const { v4: uuidv4 } = require('uuid')
const { TABLES } = require('../utils/constants')

const ITEM_TEXT_ATTRS = {
  id: 'id',
  item_id: 'item_id',
  key: 'key',
  value: 'value',
  author_id: 'author_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
}

const ITEM_NUMBER_ATTRS = {
  id: 'id',
  item_id: 'item_id',
  key: 'key',
  value: 'value',
  author_id: 'author_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
}

const ITEM_LONG_TEXT_ATTRS = {
  id: 'id',
  item_id: 'item_id',
  key: 'key',
  value: 'value',
  author_id: 'author_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
}

module.exports = {
  ITEM_TEXT_ATTRS,
  ITEM_NUMBER_ATTRS,
  ITEM_LONG_TEXT_ATTRS,
}
