const { LOOT } = require('../entities/loot')
const { TABLES } = require('../utils/constants')
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(TABLES.loot, (table) => {
    table.string(LOOT.eventId).after(LOOT.creatorId).defaultTo('')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {}
