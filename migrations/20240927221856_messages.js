const { MESSAGE } = require('../entities/messages')
const { TABLES } = require('../utils/constants')
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(TABLES.messages, (table) => {
    table.uuid(MESSAGE.id).primary()
    table.string(MESSAGE.room_id).notNullable()
    table.string(MESSAGE.author_id).notNullable()
    table.text(MESSAGE.content).notNullable()
    table.timestamp(MESSAGE.deleted_at)
    table.timestamps(true, true)
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {}
