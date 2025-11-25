const { knex } = require('../utils/db')
const { v4: uuidv4 } = require('uuid')
const { TABLES } = require('../utils/constants')

const ITEM_MEDIAS = {
  id: 'id',
  item_id: 'item_id',
  media_id: 'media_id',
  relation_type: 'relation_type',
  position: 'position',
  created_at: 'created_at',
  updated_at: 'updated_at',
  author_id: 'author_id',
}

module.exports = {
  ITEM_MEDIAS,
  async updateOrCreateMediaForItem({ itemId, mediaId, authorId, type }) {
    const itemMediaExists = await knex(TABLES.item_medias)
      .where(ITEM_MEDIAS.item_id, itemId)
      .andWhere(ITEM_MEDIAS.relation_type, type)
      .first()

    if (itemMediaExists) {
      await knex(TABLES.item_medias)
        .where(ITEM_MEDIAS.item_id, itemId)
        .andWhere(ITEM_MEDIAS.relation_type, type)
        .update({ media_id: mediaId, updated_at: new Date() })
      return itemMediaExists
    }

    const newItemMedia = {
      id: uuidv4(),
      item_id: itemId,
      media_id: mediaId,
      relation_type: type,
      author_id: authorId,
      created_at: new Date(),
      updated_at: new Date(),
    }
    await knex(TABLES.item_medias).insert(newItemMedia)
    return newItemMedia
  },
  async deleteMediaForItem({ itemId, mediaId }) {
    try {
      await knex(TABLES.item_medias)
        .where(ITEM_MEDIAS.item_id, itemId)
        .andWhere(ITEM_MEDIAS.media_id, mediaId)
        .delete()
    } catch (error) {
      console.error(error)
    }
  },
  async isMediaUsedByOtherItems({ itemId, mediaId }) {
    try {
      const result = await knex(TABLES.item_medias)
        .where(ITEM_MEDIAS.media_id, mediaId)
        .where(ITEM_MEDIAS.item_id, '!=', itemId)
        .count('* as count')
        .first()
      return parseInt(result.count) > 0
    } catch (error) {
      console.error(error)
      return false
    }
  },
}
