const { knex } = require('../utils/db')
const { v4: uuidv4 } = require('uuid')
const { TABLES } = require('../utils/constants')
const { getMediasByItemId } = require('./media')
const { getTagByItemId } = require('./tag')
const { getCompaniesByItemId } = require('./company')
const { ITEMS } = require('./items')

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
  async createItemHistory(itemId) {
    const item = await knex(TABLES.items).where(ITEMS.id, itemId).first()
    const companies = await getCompaniesByItemId(item.id)
    const medias = await getMediasByItemId(item.id)
    const tags = await getTagByItemId(item.id)

    companies.forEach((c) => {
      item[c.relation_type] = c
    })
    item.medias = medias
    item.tags = tags

    if (!item.id) return

    const old = await knex(TABLES.item_history)
      .where({ item_id: item.id })
      .orderBy('modified_at', 'desc')
      .select('version')
      .first()

    const historyId = uuidv4()
    try {
      await knex(TABLES.item_history).insert({
        version: (old?.version || 0) + 1,
        item_id: item.id,
        id: historyId,
        author_id: item.author_id,
        changes: JSON.stringify(item),
        modified_at: new Date(),
      })
    } catch (error) {
      console.log('ITEM HISTORY :', error)
    }
  },
}
