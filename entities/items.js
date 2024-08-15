const { knex } = require('../utils/db')
const { v4: uuidv4 } = require('uuid')
const { TABLES } = require('../utils/constants')
const { getSlug } = require('../utils/get-slug')
const { COMPANY } = require('./company')
const { ITEM_COMPANIES } = require('./item-company')
const { MEDIA } = require('./media')

const ITEMS = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  release_year: 'release_year',
  description: 'description',
  type: 'type', // e.g., 'item', 'game'
  cover_id: 'cover_id',
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
}

module.exports = {
  ITEMS,
  ITEMS_HISTORY,
  ITEM_TYPE,

  async getMachines() {
    return await knex(TABLES.items)
      .where({ type: ITEM_TYPE.machine })
      .leftJoin(
        TABLES.item_companies,
        TABLES.item_companies + '.' + ITEM_COMPANIES.item_id,
        '=',
        TABLES.items + '.' + ITEMS.id
      )
      .leftJoin(
        TABLES.companies,
        TABLES.companies + '.' + COMPANY.id,
        '=',
        TABLES.item_companies + '.' + ITEM_COMPANIES.company_id
      )
      .select(
        TABLES.items + '.' + ITEMS.id,
        TABLES.items + '.' + ITEMS.name,
        TABLES.items + '.' + ITEMS.release_year,
        TABLES.items + '.' + ITEMS.slug,
        TABLES.companies + '.' + COMPANY.name + ' as manufacturer'
      )
      .orderBy(ITEMS.name)
  },
  async createItems(item) {
    try {
      const id = uuidv4()
      const newItem = {
        id,
        name: item.name,
        type: item.type || 'item',
        cover_id: item.cover_id || null,
        author_id: item.author_id,
        release_year: item.release_year || null,
        description: item.description || null,
        slug: getSlug(item.name),
        created_at: new Date(),
        updated_at: new Date(),
      }
      await knex(TABLES.items).insert(newItem)

      return {
        ...newItem,
        description: item.description,
      }
    } catch (error) {
      console.log('MEDIA CREATE :', error)
    }
  },
  async getItemBySlug(slug) {
    return await knex(TABLES.items)
      .leftJoin(
        TABLES.item_companies,
        TABLES.item_companies + '.' + ITEM_COMPANIES.item_id,
        '=',
        TABLES.items + '.' + ITEMS.id
      )
      .leftJoin(
        TABLES.companies,
        TABLES.companies + '.' + COMPANY.id,
        '=',
        TABLES.item_companies + '.' + ITEM_COMPANIES.company_id
      )
      .leftJoin(
        TABLES.medias,
        TABLES.medias + '.' + MEDIA.id,
        '=',
        TABLES.items + '.' + ITEMS.cover_id
      )
      .select(
        TABLES.items + '.*',
        TABLES.companies + '.' + COMPANY.id + ' as manufacturer_id',
        TABLES.companies + '.' + COMPANY.name + ' as manufacturer_name',
        TABLES.medias + '.' + MEDIA.url + ' as cover_url'
      )
      .where({ [TABLES.items + '.' + ITEMS.slug]: slug })
      .first()
  },
}
