const { GIFTS_PACK } = require('../entities/gifts')
const { TABLES } = require('../utils/constants')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.schema.alterTable(TABLES.gifts_pack, (table) => {
    table.uuid(GIFTS_PACK.author_id).references('id').inTable(TABLES.authors)
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {}
