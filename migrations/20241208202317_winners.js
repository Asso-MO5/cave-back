const { LOOT } = require('../entities/loot')
const { TABLES } = require('../utils/constants')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.schema.createTable(TABLES.loot, (table) => {
    table.uuid(LOOT.id).primary()
    table.string(LOOT.winnerName).notNullable()
    table.string(LOOT.winneremail)
    table.text(LOOT.loot).notNullable()
    table.uuid(LOOT.creatorId).notNullable()
    table.uuid(LOOT.withdrawalId)

    table.dateTime(LOOT.winned_at)
    table.dateTime(LOOT.withdrawal_at)
    table.timestamps(true, true)
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {}
