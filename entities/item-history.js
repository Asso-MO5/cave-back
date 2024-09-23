const { TABLES } = require('../utils/constants')
const { knex } = require('../utils/db')
const { getItemById } = require('./items')
const { v4: uuidv4 } = require('uuid')

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
  async createItemHistory(id, author_id) {
    const item = await getItemById(id)
    const relations = {}
    for (const relation of item.relations) {
      const rel = await getItemById(relation.id)
      relations[rel.type] = rel
    }

    const history = {
      id: uuidv4(),
      [ITEM_HISTORY.item_id]: id,
      [ITEM_HISTORY.version]: 1,
      [ITEM_HISTORY.changes]: {
        ...item,
        relations,
      },
      [ITEM_HISTORY.modified_at]: new Date(),
      [ITEM_HISTORY.author_id]: author_id,
    }

    try {
      await knex(TABLES.item_history).insert(history)
    } catch (e) {
      console.error(e)
    }
  },
}
