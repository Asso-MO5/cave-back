const { TABLES } = require('../utils/constants')
const { knex } = require('../utils/db')
const { ITEM_TAGS } = require('./item-tags')
const TAG = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  author_id: 'author_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
}

const TAG_RELATION = {
  id: 'id',
  tag_id: 'tag_id',
  entity_id: 'entity_id',
  entity_type: 'entity_type',
  author_id: 'author_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
}

module.exports = {
  TAG,
  TAG_RELATION,
  async getTagByItemId(itemId) {
    return await knex(TABLES.tags)
      .leftJoin(
        TABLES.item_tags,
        `${TABLES.tags}.${TAG.id}`,
        '=',
        `${TABLES.item_tags}.${ITEM_TAGS.tag_id}`
      )
      .where(`${TABLES.item_tags}.${ITEM_TAGS.item_id}`, itemId)
      .select(
        TABLES.tags + '.*',
        TABLES.item_tags + '.' + ITEM_TAGS.id + ' as item_tag_id'
      )
  },
}
