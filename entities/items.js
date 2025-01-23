const { knex } = require('../utils/db')
const { v4: uuidv4 } = require('uuid')
const { TABLES } = require('../utils/constants')
const { getMediaUrl } = require('../utils/media-url')
const { translateTypeFr } = require('../utils/translate-type')

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
  async createItem({ name, type, author_id, ...rest }) {
    const id = uuidv4()
    const now = new Date().toISOString()

    try {
      await knex(TABLES.items).insert({
        [ITEMS.id]: id,
        [ITEMS.name]: name,
        [ITEMS.type]: type,
        [ITEMS.status]: 'draft',
        [ITEMS.author_id]: author_id,
        [ITEMS.created_at]: now,
        [ITEMS.updated_at]: now,
        ...rest,
      })
      return id
    } catch (e) {
      console.error(e)
      return null
    }
  },
  async getSimilarCartel(name) {
    try {
      return knex(TABLES.items)
        .where(ITEMS.type, '<>', ITEM_TYPE.cartel)
        .where(ITEMS.name, 'like', `%${name}%`)
        .first()
    } catch (e) {
      console.error(e)
      return null
    }
  },
  async getItems({
    itemType,
    place,
    type: rType,
    name,
    status,
    limit,
    offset,
    order = 'asc',
    sort = 'name',
    associated_machine,
  }) {
    const query = knex(TABLES.items + ' as it_origin')
    try {
      // Appliquer les filtres sur le type et la recherche
      if (itemType) query.where('it_origin.type', itemType)
      if (status) query.where('it_origin.status', 'like', `%${status}%`)
      if (name) query.where('it_origin.name', 'like', `%${name}%`)
      if (associated_machine)
        query.where('machine.name', 'like', `%${associated_machine}%`)
      // Ajouter les jointures pour les attributs "place" et "origin"
      query
        .leftJoin(`${TABLES.item_text_attrs} as attrs_place`, function () {
          this.on('attrs_place.item_id', '=', `it_origin.id`).andOn(
            'attrs_place.key',
            '=',
            knex.raw('?', 'var_place')
          )
        })
        .leftJoin(`${TABLES.item_text_attrs} as attrs_origin`, function () {
          this.on('attrs_origin.item_id', '=', `it_origin.id`).andOn(
            'attrs_origin.key',
            '=',
            knex.raw('?', 'var_origin')
          )
        })

      // Ajouter une jointure pour vérifier la présence d'une couverture
      query.leftJoin(`${TABLES.item_medias} as media`, function () {
        this.on('media.item_id', '=', 'it_origin.id').andOn(
          'media.relation_type',
          '=',
          knex.raw('?', 'cover')
        )
      })

      // Ajouter les jointures pour récupérer les types liés
      query.leftJoin(
        `${TABLES.item_relation} as relation`,
        'it_origin.id',
        '=',
        'relation.item_left_id'
      )
      query.leftJoin(`${TABLES.items} as it`, function () {
        this.on('relation.item_ref_id', '=', 'it.id')
      })

      // Ajouter une jointure pour la machine associée si l'item est un jeu
      query
        .leftJoin(`${TABLES.item_relation} as relation_machine`, function () {
          this.on('it.id', '=', 'relation_machine.item_left_id').andOn(
            'relation_machine.relation_type',
            '=',
            knex.raw('?', 'machine')
          )
        })
        .leftJoin(`${TABLES.items} as machine`, function () {
          this.on('relation_machine.item_ref_id', '=', 'machine.id')
        })

      // Sélectionner les champs nécessaires
      query
        .select(
          'it_origin.id',
          'it_origin.name',
          'it_origin.type',
          knex.raw('GROUP_CONCAT(DISTINCT it_origin.type) as types'),
          'it_origin.status',
          'attrs_place.value as place',
          'attrs_origin.value as origin',
          knex.raw('IF(COUNT(media.id) > 0, TRUE, FALSE) as has_cover'), // Vérifie si cover existe
          'machine.name as associated_machine', // Nom de la machine associée
          'it.type as rType' // Type de l'item lié
        )
        .groupBy('it_origin.id')

      // Appliquer les filtres supplémentaires
      if (rType) {
        query.andWhere('it.type', 'like', `%${translateTypeFr(rType)}%`)
      }
      if (place) {
        query.andWhere('attrs_place.value', 'like', `%${place}%`)
      }

      // Appliquer la limite et l'offset
      if (limit) query.limit(limit)
      if (offset) query.offset(offset)

      // Validation du champ "sort"
      const validSortFields = [
        'name',
        'rType',
        'status',
        'place',
        'origin',
        'associated_machine',
      ]
      const sortField = validSortFields.includes(sort) ? sort : 'name'
      const sortOrder = order === 'desc' ? 'desc' : 'asc'

      query.orderBy(sortField, sortOrder)

      // Clone pour le count
      const countQuery = query.clone()
      delete countQuery._single.limit
      delete countQuery._single.offset

      // Exécuter les requêtes
      const items = await query
      const count = await countQuery.count()

      return {
        total: count?.[0]?.['count(*)'] || 0,
        items,
      }
    } catch (e) {
      console.error(e)
      return null
    }
  },
  async getCompanies({ search, limit, offset, order = 'asc', sort = 'name' }) {
    const query = knex(TABLES.items + ' as it_origin')
    try {
      // Appliquer les filtres sur le type et la recherche
      query.where((builder) => {
        builder
          .where('it_origin.type', 'manufacturer')
          .orWhere('it_origin.type', 'publisher')
          .orWhere('it_origin.type', 'developer')
          .orWhere('it_origin.type', 'distributor')
          .orWhere('it_origin.type', 'retailer')
          .orWhere('it_origin.type', 'association')
      })

      if (search) {
        query.andWhere('it_origin.name', 'like', `%${search}%`)
      }

      // Cloner la requête pour obtenir le count
      const countQuery = query.clone()
      const count = await countQuery.count()

      // Appliquer la limite et l'offset
      if (limit) query.limit(limit)
      if (offset) query.offset(offset)

      // Ajouter les jointures pour les attributs "place" et "origin"
      query
        .leftJoin(`${TABLES.item_text_attrs} as attrs_place`, function () {
          this.on('attrs_place.item_id', '=', `it_origin.id`).andOn(
            'attrs_place.key',
            '=',
            knex.raw('?', 'var_place')
          ) // Récupérer "place"
        })
        .leftJoin(`${TABLES.item_text_attrs} as attrs_origin`, function () {
          this.on('attrs_origin.item_id', '=', `it_origin.id`).andOn(
            'attrs_origin.key',
            '=',
            knex.raw('?', 'var_origin')
          ) // Récupérer "origin"
        })
        .leftJoin(
          `${TABLES.item_relation} as relation`,
          'it_origin.id',
          '=',
          'relation.item_left_id'
        )
        .leftJoin(`${TABLES.items} as it`, function () {
          this.on('relation.item_ref_id', '=', 'it.id')
        })

      // Sélectionner les champs
      query
        .select(
          'it_origin.id',
          'it_origin.name',
          knex.raw('GROUP_CONCAT(DISTINCT it_origin.type) as types'), // Regrouper les types
          'it_origin.status',
          'attrs_place.value as place', // Attribut "place"
          'attrs_origin.value as origin' // Attribut "origin"
        )
        .groupBy('it_origin.name') // Grouper par nom d'entreprise

      // Validation du champ "sort" (par défaut sur "name")
      const validSortFields = ['name', 'types', 'status', 'place', 'origin']
      const sortField = validSortFields.includes(sort) ? sort : 'name'

      // Validation de l'ordre (par défaut "asc")
      const sortOrder = order === 'desc' ? 'desc' : 'asc'

      // Appliquer l'ordre de tri dynamique
      query.orderBy(sortField, sortOrder)

      // Exécuter la requête pour obtenir les items
      const items = await query

      return {
        total: count[0]['count(*)'],
        items,
      }
    } catch (e) {
      console.error(e)
      return null
    }
  },
  async getItemsForExport({ type, ids, place }) {
    const query = knex(TABLES.items + ' as it_origin')
    try {
      // Appliquer les filtres sur le type et la recherche
      if (type) query.where('it_origin.type', type)
      if (ids) query.whereIn('it_origin.id', ids)

      if (place) query.where('attrs_place.value', place)

      // Ajouter les jointures pour les attributs "place" et "origin"
      query
        .leftJoin(`${TABLES.item_text_attrs} as attrs_place`, function () {
          this.on('attrs_place.item_id', '=', `it_origin.id`).andOn(
            'attrs_place.key',
            '=',
            knex.raw('?', 'var_place')
          ) // Récupérer "place"
        })
        .leftJoin(`${TABLES.item_text_attrs} as attrs_origin`, function () {
          this.on('attrs_origin.item_id', '=', `it_origin.id`).andOn(
            'attrs_origin.key',
            '=',
            knex.raw('?', 'var_origin')
          ) // Récupérer "origin"
        })
        .leftJoin(
          `${TABLES.item_relation} as relation`,
          'it_origin.id',
          '=',
          'relation.item_left_id'
        )
        .leftJoin(`${TABLES.items} as it`, function () {
          this.on('relation.item_ref_id', '=', 'it.id')
        })
        .select(
          `it_origin.name`,
          `it_origin.id`,
          // `it_origin.type`,
          `it_origin.status`,
          `it.type as type`,
          'attrs_place.value as place',
          'attrs_origin.value as origin'
        )
        .distinct('it_origin.id')

      query.orderBy('place', 'asc')

      return await query
    } catch (e) {
      console.error(e)
      return null
    }
  },
  async getSimilarItems(name, type, id = '__new__') {
    try {
      return knex(TABLES.items)
        .where(ITEMS.type, type)
        .where(ITEMS.name, '=', name)
        .whereNot(ITEMS.id, id)
        .select('id', 'name')
        .first()
    } catch (e) {
      console.error(e)
      return null
    }
  },
  async getItemsIdByPlace() {
    try {
      return knex(TABLES.item_text_attrs)
        .where('key', 'place')
        .select('item_id', 'value')
    } catch (e) {
      console.error(e)
      return null
    }
  },
  async getItemById(id, req) {
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

      const relations = await knex(TABLES.item_relation)
        .where({ item_left_id: id })
        .whereNot({ relation_type: '' })
        .join(TABLES.items, 'items.id', '=', 'item_relation.item_ref_id')
        .select('items.*', 'item_relation.relation_type')

      item.relations = relations

      const attrs = [
        ...additionalTextAttrs,
        ...additionalLongTextAttrs,
        ...additionalNumberAttrs,
      ]

      attrs.forEach((attr) => {
        if (attr.attr.match(/description/)) {
          const isArrayOnString = attr.value.match(/^\[.*\]$/)
          item[attr.attr] = isArrayOnString
            ? JSON.parse(attr.value)
            : [
                {
                  id: uuidv4(),
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: attr.value,
                      styles: {},
                    },
                  ],
                  children: [],
                },
              ]
        } else item[attr.attr] = attr.value
      })

      if (req) {
        return {
          ...item,
          medias: item.medias.map((media) => ({
            ...media,
            url: getMediaUrl(media.url, req),
          })),
        }
      } else {
        return item
      }
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
  async createOrUpdateItemTextAttrs(item_id, attr, value, auth) {
    try {
      await knex(TABLES.item_text_attrs).where({ item_id, key: attr }).delete()

      const id = uuidv4()
      return knex(TABLES.item_text_attrs).insert({
        id,
        item_id,
        key: attr,
        value,
        author_id: auth.id,
      })
    } catch (e) {
      console.error(e)
      return null
    }
  },
  async createOrUpdateItemLongTextAttrs(item_id, attr, value, auth) {
    try {
      await knex(TABLES.item_long_text_attrs)
        .where({ item_id, key: attr })
        .delete()

      const id = uuidv4()
      return knex(TABLES.item_long_text_attrs).insert({
        id,
        item_id,
        key: attr,
        value: typeof value !== 'string' ? JSON.stringify(value) : value,
        author_id: auth.id,
      })
    } catch (e) {
      console.error(e)
      return null
    }
  },
  async createOrUpdateItemNumberAttrs(item_id, attr, value, auth) {
    try {
      await knex(TABLES.item_number_attrs)
        .where({ item_id, key: attr })
        .delete()

      const id = uuidv4()
      return knex(TABLES.item_number_attrs).insert({
        id,
        item_id,
        key: attr,
        value,
        author_id: auth.id,
      })
    } catch (e) {
      console.error(e)
      return null
    }
  },
  async deleteItem(id) {
    try {
      await knex(TABLES.item_history).where({ item_id: id }).delete()
      await knex(TABLES.item_text_attrs).where({ item_id: id }).delete()
      await knex(TABLES.item_long_text_attrs).where({ item_id: id }).delete()
      await knex(TABLES.item_number_attrs).where({ item_id: id }).delete()
      await knex(TABLES.item_medias).where({ item_id: id }).delete()
      await knex(TABLES.item_relation)
        .where({ item_left_id: id })
        .orWhere({ item_ref_id: id })
        .delete()
      return knex(TABLES.items).where(ITEMS.id, id).delete()
    } catch (e) {
      console.error(e)
      return null
    }
  },
  /**
   * @description ### Modification du type d'un item
   * *Utilisé principalement pour les items imbriqués*
   * - Supprime les relation ou l'item est en `item_ref_id`
   * - Supprime les champs additionnels
   *
   **/
  async changeItemType(id, type) {
    // supprimer les items en relation
    try {
      await knex(TABLES.item_relation)
        .where('item_left_id ', id)
        .where('relation_type', '<>', 'cartel')
        .delete()
      await knex(TABLES.item_text_attrs).where({ item_id: id }).delete()
      await knex(TABLES.item_long_text_attrs).where({ item_id: id }).delete()
      await knex(TABLES.item_number_attrs).where({ item_id: id }).delete()
      await knex(TABLES.item_medias).where({ item_id: id }).delete()
      // Attributes
      return knex(TABLES.items).where(ITEMS.id, id).update({ type })
    } catch (e) {
      console.error(e)
      return null
    }
  },
}
