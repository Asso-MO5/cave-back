const { knex } = require('../utils/db')
const { v4: uuidv4 } = require('uuid')
const { TABLES } = require('../utils/constants')
const { getSlug } = require('../utils/get-slug')
const { COMPANY } = require('./company')
const { ITEM_COMPANIES } = require('./item-company')
const { MEDIA } = require('./media')
const { ITEM_ITEMS } = require('./item-items')

const ITEMS = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  release_year: 'release_year',
  description: 'description',
  type: 'type', // e.g., 'item', 'game'
  status: 'status',
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
    try {
      return await knex(TABLES.items)
        .where({ [`${TABLES.items}.${ITEMS.type}`]: type })
        .leftJoin(
          TABLES.item_companies,
          `${TABLES.item_companies}.${ITEM_COMPANIES.item_id}`,
          `${TABLES.items}.${ITEMS.id}`
        )
        .leftJoin(
          TABLES.companies,
          `${TABLES.companies}.${COMPANY.id}`,
          `${TABLES.item_companies}.${ITEM_COMPANIES.company_id}`
        )
        .select(
          `${TABLES.items}.${ITEMS.name}`,
          `${TABLES.items}.${ITEMS.slug}`,
          `${TABLES.items}.${ITEMS.release_year}`,
          `${TABLES.companies}.${COMPANY.name} as company_name`,
          `${ITEM_COMPANIES.relation_type}`
        )
        .orderBy(ITEMS.name)
    } catch (error) {
      console.log('GET ITEMS :', error)
      throw new Error(error)
    }
  },
  async getMachineByGameId(gameId) {
    try {
      return await knex(TABLES.items)
        .leftJoin(
          TABLES.item_items,
          `${TABLES.items}.${ITEMS.id}`,
          `${TABLES.item_items}.${ITEM_ITEMS.item_left_id}`
        )
        .where({
          [`${TABLES.item_items}.${ITEM_ITEMS.item_right_id}`]: gameId,
          [`${TABLES.item_items}.${ITEM_ITEMS.relation_type}`]: 'machine_game',
        })
        .select(
          TABLES.items + '.*',
          `${TABLES.item_items}.${ITEM_ITEMS.item_ref_id}`
        )
        .first()
    } catch (error) {
      console.log('GET MACHINE BY GAME ID :', error)
      throw new Error(error)
    }
  },
  async getMachinesByRefId(id) {
    try {
      return await knex(TABLES.items)
        // Joindre les relations entre les machines et les items dans la table `item_items`
        .leftJoin(
          TABLES.item_items,
          `${TABLES.items}.${ITEMS.id}`,
          `${TABLES.item_items}.${ITEM_ITEMS.item_left_id}` // Lier les machines aux items par `item_right_id`
        )
        // Jointure supplémentaire pour récupérer les informations de l'item lié via `item_right_id`
        .leftJoin(
          `${TABLES.items} as related_item`,
          `${TABLES.item_items}.${ITEM_ITEMS.item_right_id}`,
          `related_item.${ITEMS.id}`
        )
        // Sélectionner uniquement les items de type "machine"
        .where(`${TABLES.items}.${ITEMS.type}`, 'machine')
        // Vérifier s'il y a des relations et appliquer le filtre seulement si c'est pertinent
        .modify(function (queryBuilder) {
          if (id) {
            queryBuilder.andWhere(function () {
              this.where(
                `${TABLES.item_items}.${ITEM_ITEMS.item_ref_id}`,
                id
              ).orWhereNull(`${TABLES.item_items}.${ITEM_ITEMS.item_ref_id}`)
            })
          }
        })
        // Sélectionner les colonnes nécessaires
        .select(
          `${TABLES.items}.${ITEMS.id}`,
          `${TABLES.items}.${ITEMS.name}`,
          'related_item.id as related_item_id'
        )
        // Trier les résultats par nom
        .orderBy([
          { column: 'related_item.id', order: 'desc' }, // Relations d'abord
          { column: `${TABLES.items}.${ITEMS.name}`, order: 'asc' }, // Tri alphabétique
        ])
    } catch (error) {
      console.log('GET MACHINES :', error)
      throw new Error(error)
    }
  },
  async createItems(item) {
    try {
      const id = uuidv4()
      let slug = getSlug(item.name)

      const existslugs = await knex(TABLES.items)
        .where({ slug })
        .count('* as count')
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
