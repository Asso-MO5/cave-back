const { TABLES } = require('../utils/constants')
const { knex } = require('../utils/db')

const { v4: uuidv4 } = require('uuid')

const GIFTS_PACK = {
  id: 'id',
  email: 'email',
  retailer: 'retailer',
  campain: 'campain',
  gift: 'gift', // Template email
  numOfGifts: 'numOfGifts',
  type: 'type',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at',
}

const GIFT = {
  id: 'id',
  giftPackId: 'giftPackId',
  email: 'email',
  name: 'name',
  lastname: 'lastname',
  zipCode: 'zipCode',
  birthdate: 'birthdate',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at',
}

module.exports = {
  GIFTS_PACK,
  GIFT,
  async createLoot({
    winnerName,
    winned_at,
    winneremail,
    loot,
    creatorId,
    eventId,
  }) {
    try {
      const [id] = await knex(TABLES.loot)
        .insert({
          id: uuidv4(),
          winnerName,
          winneremail,
          loot,
          creatorId,
          eventId,
          winned_at: winned_at || new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('id')

      return id
    } catch (e) {
      console.error(e)
      return null
    }
  },
  async getLoots({
    search,
    limit,
    offset,
    order = 'asc',
    sort = 'name',
    eventId,
    winnerName,
    withdrawal_at,
  }) {
    const query = knex(TABLES.loot)
    try {
      // Appliquer les filtres sur le type et la recherche

      if (search) query.where('winnerName', 'like', `%${search}%`)
      if (eventId) query.where('eventId', 'like', `%${eventId}%`)
      if (winnerName) query.where('winnerName', 'like', `%${winnerName}%`)
      if (withdrawal_at) query.where('withdrawal_at', '<>', null)

      // Cloner la requête pour obtenir le count
      const countQuery = query.clone()
      const count = await countQuery.count()

      // Appliquer la limite et l'offset
      if (limit) query.limit(limit)
      if (offset) query.offset(offset)

      // Sélectionner les champs
      query.select('*')

      // Validation du champ "sort" (par défaut sur "name")
      const validSortFields = [
        'winnerName',
        'winneremail',
        'winned_at',
        'withdrawal_at',
        'eventId',
      ]
      const sortField = validSortFields.includes(sort)
        ? sort
        : validSortFields[0]

      const sortOrder = order === 'desc' ? 'desc' : 'asc'

      query.orderBy(sortField, sortOrder)

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
  async deleteLoot(id) {
    try {
      await knex(TABLES.loot).where('id', id).delete()
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  },

  async winnedLoot({ id, withdrawalId }) {
    const isalreadyWinned = await knex(TABLES.loot)
      .where('id', id)
      .andWhere('withdrawalId', null)
      .first()
    if (!isalreadyWinned) {
      try {
        await knex(TABLES.loot)
          .where('id', id)
          .update({ withdrawalId, withdrawal_at: null })
        return true
      } catch (e) {
        console.error(e)
        return false
      }
    } else {
      try {
        await knex(TABLES.loot)
          .where('id', id)
          .update({ withdrawalId, withdrawal_at: new Date() })
        return true
      } catch (e) {
        console.error(e)
        return false
      }
    }
  },
}
