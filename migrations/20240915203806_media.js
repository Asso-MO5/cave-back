const { ITEM_MEDIAS } = require('../entities/item-medias')
const { TABLES } = require('../utils/constants')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(TABLES.item_medias, (table) => {
    table.string(ITEM_MEDIAS.relation_type).after(ITEM_MEDIAS.author_id)
    table.bigint(ITEM_MEDIAS.position).after(ITEM_MEDIAS.relation_type)
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {}
