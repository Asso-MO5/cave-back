const { knex } = require('../utils/db')
const { v4: uuidv4 } = require('uuid')
const { TABLES } = require('../utils/constants')

const ITEMS = {
  id: 'id',
  name: 'name',
  type: 'type', // e.g., 'item', 'game', 'cartel
  status: 'status',
  author_id: 'author_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
}

const ITEMS_HISTORY = {
  ...ITEMS,
  machine_id: 'machine_id',
  medias: 'medias',
  version: 'version',
  modified_at: 'modified_at',
}

const ITEM_TYPE = {
  obj: 'obj',
  game: 'game',
  machine: 'machine',
  cartel: 'cartel',
  company: 'company',
}

module.exports = {
  ITEMS,
  ITEMS_HISTORY,
  ITEM_TYPE,
  async createItem({ name, type, author_id }) {
    const id = uuidv4()
    const now = new Date().toISOString()

    try {
      await knex(TABLES.items).insert({
        [ITEMS.id]: id,
        [ITEMS.name]: name,
        [ITEMS.type]: type,
        [ITEMS.status]: 'active',
        [ITEMS.author_id]: author_id,
        [ITEMS.created_at]: now,
        [ITEMS.updated_at]: now,
      })
      return id
    } catch (e) {
      console.error(e)
      return null
    }
  },
  async getItems({ type, search, limit, offset }) {
    const query = knex(TABLES.items)
    try {
      if (type) query.where(ITEMS.type, type)
      if (search) query.where(ITEMS.name, 'like', `%${search}%`)

      const countQuery = query.clone()
      const count = await countQuery.count()

      if (limit) query.limit(limit)
      if (offset) query.offset(offset)

      const items = await query.select('*')
      return {
        total: count[0]['count(*)'],
        items,
      }
    } catch (e) {
      console.error(e)
      return null
    }
  },
  async getItemById(id) {
    try {
      const item_ = await knex(TABLES.items).where(ITEMS.id, id).first()

      if (!item_) return null
      const item = { ...item_ }

      const additionalTextAttrs = await knex(TABLES.item_text_attrs)
        .where({ item_id: id })
        .select('key as attr', 'value')

      const additionalLongTextAttrs = await knex(TABLES.item_long_text_attrs)
        .where({ item_id: id })
        .select('key as attr', 'value')
      const additionalNumberAttrs = await knex(TABLES.item_number_attrs)
        .where({ item_id: id })
        .select('key as attr', 'value')

      item.medias = await knex(TABLES.item_medias)
        .where({ item_id: id })
        .join(TABLES.medias, 'medias.id', '=', 'item_medias.media_id')
        .select(
          'medias.id',
          'medias.url',
          'medias.alt',
          'medias.type',
          'item_medias.relation_type',
          'item_medias.position'
        )

      const attrs = [
        ...additionalTextAttrs,
        ...additionalLongTextAttrs,
        ...additionalNumberAttrs,
      ]

      attrs.forEach((attr) => {
        if (attr.attr.match(/description/))
          item[attr.attr] = JSON.parse(attr.value)
        else item[attr.attr] = attr.value
      })

      return item
    } catch (e) {
      console.error(e)
      return null
    }
  },
  async updateItem(id, data) {
    try {
      return knex(TABLES.items).where(ITEMS.id, id).update(data)
    } catch (e) {
      console.error(e)
      return null
    }
  },
  async createOrUpdateItemTextAttrs(itemId, attr, value, auth) {
    try {
      await knex(TABLES.item_text_attrs)
        .where({ item_id: itemId, key: attr })
        .delete()

      const id = uuidv4()
      return knex(TABLES.item_text_attrs).insert({
        id,
        item_id: itemId,
        key: attr,
        value,
        author_id: auth.id,
      })
    } catch (e) {
      console.error(e)
      return null
    }
  },
  async createOrUpdateItemLongTextAttrs(itemId, attr, value, auth) {
    console.log('createOrUpdateItemLongTextAttrs', itemId, attr, value, auth)
    try {
      await knex(TABLES.item_long_text_attrs)
        .where({ item_id: itemId, key: attr })
        .delete()

      const id = uuidv4()
      return knex(TABLES.item_long_text_attrs).insert({
        id,
        item_id: itemId,
        key: attr,
        value: typeof value !== 'string' ? JSON.stringify(value) : value,
        author_id: auth.id,
      })
    } catch (e) {
      console.error(e)
      return null
    }
  },
  async createOrUpdateItemNumberAttrs(itemId, attr, value, auth) {
    try {
      await knex(TABLES.item_number_attrs)
        .where({ item_id: itemId, key: attr })
        .delete()

      const id = uuidv4()
      return knex(TABLES.item_number_attrs).insert({
        id,
        item_id: itemId,
        key: attr,
        value,
        author_id: auth.id,
      })
    } catch (e) {
      console.error(e)
      return null
    }
  },
}
