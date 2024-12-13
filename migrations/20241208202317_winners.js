const { GIFTS_PACK, GIFT } = require('../entities/gifts')
const { TABLES } = require('../utils/constants')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.schema.createTable(TABLES.gifts_pack, (table) => {
    table.uuid(GIFTS_PACK.id).primary()
    table.string(GIFTS_PACK.campain).notNullable()
    table.string(GIFTS_PACK.retailer).notNullable()
    table.string(GIFTS_PACK.email).notNullable()
    table.string(GIFTS_PACK.gift).notNullable()
    table.integer(GIFTS_PACK.numOfGifts).notNullable()
    table.string(GIFTS_PACK.type).notNullable()
    table.string(GIFTS_PACK.status).notNullable()

    table.timestamps(true, true)
  })

  await knex.schema.createTable(TABLES.gifts, (table) => {
    table.uuid(GIFT.id).primary()
    table.uuid(GIFT.giftPackId).notNullable()
    table.string(GIFT.email).notNullable()
    table.string(GIFT.name).notNullable()
    table.string(GIFT.lastname).notNullable()
    table.string(GIFT.zipCode).notNullable()
    table.date(GIFT.birthdate).notNullable()
    table.string(GIFT.status).notNullable()

    table.timestamps(true, true)
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {}
