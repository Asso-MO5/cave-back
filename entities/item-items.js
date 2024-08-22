const { knex } = require('../utils/db')
const { v4: uuidv4 } = require('uuid')
const { TABLES } = require('../utils/constants')

const ITEM_ITEMS = {
  id: 'id',
  item_left_id: 'item_left_id',
  item_right_id: 'item_right_id',
  item_ref_id: 'item_ref_id',
  relation_type: 'relation_type', // e.g., 'game-machine', 'list'...
  created_at: 'created_at',
  updated_at: 'updated_at',
  author_id: 'author_id',
}

module.exports = {
  ITEM_ITEMS,
  async getRelationbyLeftIdAndRightId(leftId, itemRightId) {
    return await knex(TABLES.item_items)
      .where({
        [`${TABLES.item_items}.${ITEM_ITEMS.item_left_id}`]: leftId,
        [`${TABLES.item_items}.${ITEM_ITEMS.item_right_id}`]: itemRightId,
      })
      .first()
  },
  async getRelationByReIdAndType(refId, relationType) {
    return await knex(TABLES.item_items)
      .where({
        [`${ITEM_ITEMS.item_ref_id}`]: refId,
        [`${ITEM_ITEMS.relation_type}`]: relationType,
      })
      .first()
  },
  async getRelationbyRefIdAndLeftId(refId, itemLeftId) {
    console.log({
      [`${ITEM_ITEMS.item_ref_id}`]: refId,
      [`${ITEM_ITEMS.item_left_id}`]: itemLeftId,
    })
    return await knex(TABLES.item_items)
      .where({
        [`${ITEM_ITEMS.item_ref_id}`]: refId,
        [`${ITEM_ITEMS.item_left_id}`]: itemLeftId,
      })
      .first()
  },
  /**
   *
   * @param {string} itemRefId
   * @param {string} itemLeftId
   * @param {string} itemRightId
   * @param { 'machine_game' | 'list_game' | 'list_machine'} relationType
   * @param {string} authorId
   * @returns {Promise } id
   */
  async createRelation(
    itemRefId,
    itemRightId,
    itemLeftId,
    relationType,
    authorId
  ) {
    const id = uuidv4()
    try {
      return await knex(TABLES.item_items).insert({
        [ITEM_ITEMS.id]: id,
        [ITEM_ITEMS.item_ref_id]: itemRefId,
        [ITEM_ITEMS.item_left_id]: itemLeftId,
        [ITEM_ITEMS.item_right_id]: itemRightId,
        [ITEM_ITEMS.relation_type]: relationType,
        [ITEM_ITEMS.author_id]: authorId,
        [ITEM_ITEMS.created_at]: new Date(),
        [ITEM_ITEMS.updated_at]: new Date(),
      })
    } catch (error) {
      console.log('CREATE RELATION :', error)
    }
  },
}
