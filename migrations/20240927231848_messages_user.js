const { MESSAGE } = require('../entities/messages')
const { TABLES } = require('../utils/constants')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(TABLES.messages, (table) => {
    table.text(MESSAGE.author_avatar).after(MESSAGE.author_id).defaultTo('')
    table.string(MESSAGE.author_name).after(MESSAGE.author_avatar).defaultTo('')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {}
