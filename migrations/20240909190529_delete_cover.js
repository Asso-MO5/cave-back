const { TABLES } = require('../utils/constants')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(TABLES.companies, (table) => {
    table.dropColumn('logo_id')
  })

  await knex.schema.alterTable(TABLES.items, (table) => {
    table.dropColumn('cover_id')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {}
