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

  async getItems(type) {
    const baseQuery = knex(TABLES.items)
      .where({ [`${TABLES.items}.${ITEMS.type}`]: type })
      .orderBy(ITEMS.name)

    if (type === 'machine') {
      baseQuery
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
        .select([
          TABLES.items + '.*',
          TABLES.companies + '.' + COMPANY.id + ' as manufacturer_id',
          TABLES.companies + '.' + COMPANY.name + ' as manufacturer_name',
          TABLES.medias + '.' + MEDIA.url + ' as cover_url',
        ])
    } else if (type === 'game') {
      // Effectuer des jointures spécifiques pour les jeux
    }

    try {
      return await baseQuery
    } catch (error) {
      console.log('GET ITEMS :', error)
      throw new Error(error)
    }
  },
  async createItems(item) {
    try {
      const id = uuidv4()
      let slug = getSlug(item.name)

      const existslugs = await knex(TABLES.items)
        .where({ slug })
        .count()
        .first()

      if (existslugs.count > 0) slug = slug + '-' + existslugs.count

      const newItem = {
        id,
        name: item.name,
        type: item.type || 'item',
        cover_id: null,
        author_id: item.author_id,
        release_year: null,
        description: null,
        slug,
        created_at: new Date(),
        updated_at: new Date(),
      }

      await knex(TABLES.items).insert(newItem)
      return newItem
    } catch (error) {
      console.log('MEDIA CREATE :', error)
    }
  },
  async getItemById(id) {
    return await knex(TABLES.items).where({ id }).first()
  },
  async getItemByNameAndType(name, type) {
    try {
      const item = await knex(TABLES.items)
        .where({ [ITEMS.name]: name, [ITEMS.type]: type })
        .first()

      return item
    } catch (error) {
      console.log('GET ITEM BY NAME AND TYPE :', error)
    }
  },
  async getItemBySlug(slug) {
    const baseQuery = knex(TABLES.items).where({
      [TABLES.items + '.' + ITEMS.slug]: slug,
    })

    baseQuery
      .leftJoin(
        TABLES.medias,
        TABLES.medias + '.' + MEDIA.id,
        '=',
        TABLES.items + '.' + ITEMS.cover_id
      )
      .select(
        TABLES.items + '.*',
        TABLES.medias + '.' + MEDIA.url + ' as cover_url'
      )

    return await baseQuery.first()
  },
  async updateItem(id, partial) {
    const item = await knex(TABLES.items).where({ id }).first()

    if (!item) throw new Error('Item not found')

    const update = {
      ...item,
      ...Object.keys(partial).reduce((acc, key) => {
        if (!partial[key]) {
          acc[key] = knex.raw('NULL')
        } else {
          acc[key] = partial[key]
        }

        return acc
      }, {}),
      updated_at: new Date(),
    }

    try {
      await knex(TABLES.items).where({ id }).update(update)
    } catch (error) {
      console.log('ITEM UPDATE :', error)
    }
  },
}
