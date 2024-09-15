const { knex } = require('../utils/db')
const { v4: uuidv4 } = require('uuid')
const { TABLES } = require('../utils/constants')

const ITEM_RELATION = {
  id: 'id',
  item_ref_id: 'item_ref_id',
  item_left_id: 'item_left_id',
  relation_type: 'relation_type',
  created_at: 'created_at',
  updated_at: 'updated_at',
  author_id: 'author_id',
}

module.exports = {
  ITEM_RELATION,

  async createItemRelation({
    item_ref_id,
    item_left_id,
    relation_type,
    author_id,
  }) {
    const id = uuidv4()
    const now = new Date().toISOString()

    try {
      await knex(TABLES.item_relation).insert({
        [ITEM_RELATION.id]: id,
        [ITEM_RELATION.item_ref_id]: item_ref_id,
        [ITEM_RELATION.item_left_id]: item_left_id,
        [ITEM_RELATION.relation_type]: relation_type,
        [ITEM_RELATION.author_id]: author_id,
        [ITEM_RELATION.created_at]: now,
        [ITEM_RELATION.updated_at]: now,
      })
      return id
    } catch (e) {
      console.error(e)
      return null
    }
  },
}
