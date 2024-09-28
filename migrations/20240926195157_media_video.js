const { MEDIA } = require('../entities/media')
const { TABLES } = require('../utils/constants')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(TABLES.medias, (table) => {
    table.text(MEDIA.cover_url).after(MEDIA.url).defaultTo('')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function () {}
