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
  author_id: 'author_id',
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
  async createGiftPack({
    email,
    retailer = 'mo5',
    campain,
    gift,
    numOfGifts,
    type,
    author_id,
  }) {
    try {
      const id = uuidv4()
      await knex(TABLES.gifts_pack)
        .insert({
          id,
          email,
          retailer,
          campain,
          gift,
          numOfGifts,
          type,
          author_id,
          status: 'notDistributed',
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('id')

      return {
        id,
        email,
        retailer,
        campain,
        gift,
        numOfGifts,
        type,
        author_id,
        status: 'draft',
        created_at: new Date(),
        updated_at: new Date(),
      }
    } catch (e) {
      console.error(e)
      return null
    }
  },
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
          email: winneremail,
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
  async getGiftsPacks({
    search,
    limit,
    offset,
    order = 'asc',
    sort = 'name',
    retailer,
    campain,
    type,
    status,
  }) {
    const query = knex(TABLES.gifts_pack)
    try {
      // Appliquer les filtres sur le type et la recherche
      if (search) query.where('retailer', 'like', `%${retailer}%`)
      if (campain) query.where('campain', 'like', `%${campain}%`)
      if (type) query.where('type', 'like', `%${type}%`)
      if (status) query.where('status', 'like', `%${status}%`)

      // Cloner la requête pour obtenir le count
      const countQuery = query.clone()
      const count = await countQuery.count()

      // Appliquer la limite et l'offset
      if (limit) query.limit(limit)
      if (offset) query.offset(offset)

      query.leftJoin(`${TABLES.gifts} as gifts`, function () {
        this.on('gifts.giftPackId', '=', 'gifts_pack.id').andOn(
          'gifts.status',
          '=',
          knex.raw('?', ['distributed'])
        )
      })

      // Sélectionner les champs
      query
        .select(
          TABLES.gifts_pack + '.id',
          TABLES.gifts_pack + '.email',
          TABLES.gifts_pack + '.retailer',
          TABLES.gifts_pack + '.campain',
          TABLES.gifts_pack + '.gift',
          TABLES.gifts_pack + '.numOfGifts',
          knex.raw('COUNT(DISTINCT gifts.id) as givenNumOfGifts'),
          TABLES.gifts_pack + '.type',
          TABLES.gifts_pack + '.status',
          TABLES.gifts_pack + '.created_at',
          TABLES.gifts_pack + '.updated_at'
        )
        .groupBy(`${TABLES.gifts_pack}.id`)

      // Validation du champ "sort" (par défaut sur "name")
      const validSortFields = [
        'created_at',
        'retailer',
        'id',
        'email',
        'campain',
        'gift',
        'numOfGifts',
        'type',
        'status',
        'updated_at',
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
  async deleteGiftsPack(id) {
    try {
      const existGift = await knex(TABLES.gifts)
        .where('id', id)
        .where('giftPackId', id)
        .first()
      if (existGift) throw new Error('Gifts pack already distributed')

      await knex(TABLES.gifts_pack).where('id', id).delete()
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  },
  async updateGiftsPacksByGiftPackId(
    id,
    { email, retailer, campain, gift, numOfGifts }
  ) {
    try {
      await knex(TABLES.gifts_pack).where('id', id).update({
        email,
        retailer,
        campain,
        gift,
        numOfGifts,
        updated_at: new Date(),
      })

      return await knex(TABLES.gifts_pack).where('id', id).select('*').first()
    } catch (e) {
      console.error(e)
      return false
    }
  },

  async getGiftsPacksByGiftPackId(giftPackId) {
    try {
      const giftPack = await knex(TABLES.gifts_pack)
        .where('id', giftPackId)
        .select('*')
        .first()

      if (!giftPack) throw new Error('Gift pack not found')

      const { numOfGifts } = giftPack

      await knex(TABLES.gifts_pack)
        .update({
          status: 'distributed',
        })
        .where('id', giftPackId)

      const gifts = await knex(TABLES.gifts)
        .where('giftPackId', giftPackId)
        .count()

      const count = gifts[0]['count(*)']

      const diff = numOfGifts - count

      if (diff > 0) {
        await knex(TABLES.gifts).insert(
          Array.from({ length: diff }, () => ({
            id: uuidv4(),
            giftPackId,
            email: '',
            name: '',
            lastname: '',
            zipCode: '',
            birthdate: '',
            status: 'notDistributed',
            created_at: new Date(),
            updated_at: new Date(),
          }))
        )
      }

      return {
        gifts: await knex(TABLES.gifts)
          .where('giftPackId', giftPackId)
          .select('*'),
        giftPack,
      }
    } catch (e) {
      console.error(e)
      return null
    }
  },
  async getGiftById(id) {
    try {
      return await knex(TABLES.gifts).where('id', id).select('*').first()
    } catch (e) {
      console.error(e)
      return null
    }
  },
  async updateGift(id, { email, name, lastname, zipCode, birthdate, status }) {
    try {
      await knex(TABLES.gifts).where('id', id).update({
        email,
        name,
        lastname,
        zipCode,
        birthdate,
        status,
        updated_at: new Date(),
      })

      return await knex(TABLES.gifts).where('id', id).select('*').first()
    } catch (e) {
      console.error(e)
      return null
    }
  },
  async getGiftByInfo({ email, name, lastname, zipCode, birthdate }) {
    const query = knex(TABLES.gifts).where('name', name)

    if (email) query.where('email', email)
    if (lastname) query.where('lastname', lastname)
    if (zipCode) query.where('zipCode', zipCode)
    if (birthdate) query.where('birthdate', birthdate)

    try {
      return await query.select('*').first()
    } catch (e) {
      console.error(e)
      return null
    }
  },
}
