const { GIFTS_PACK } = require('../entities/gifts')
const { TABLES } = require('../utils/constants')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(TABLES.gifts_pack, (table) => {
    table
      .boolean(GIFTS_PACK.isSendOnDirect)
      .after(GIFTS_PACK.author_id)
      .defaultTo(false)
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {}
