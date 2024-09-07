const { COMPANY } = require('../entities/company')
const { ITEMS } = require('../entities/items')
const { TABLES } = require('../utils/constants')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.schema.alterTable(TABLES.items, (table) => {
    table.string(ITEMS.release_year).alter()
  })

  await knex.schema.alterTable(TABLES.companies, (table) => {
    table.string(COMPANY.borned_at).alter()
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {}
