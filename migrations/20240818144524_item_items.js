const { TABLES } = require('../utils/constants')
const { ITEM_ITEMS } = require('../entities/item-items')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(TABLES.item_items, (table) => {
    table.uuid(ITEM_ITEMS.id).primary()
    table
      .uuid(ITEM_ITEMS.item_left_id)
      .references('id')
      .inTable(TABLES.items)
      .notNullable()
    table.uuid(ITEM_ITEMS.item_ref_id).references('id').inTable(TABLES.items)
    table
      .uuid(ITEM_ITEMS.item_right_id)
      .references('id')
      .inTable(TABLES.items)
      .notNullable()
    table.string(ITEM_ITEMS.relation_type).notNullable()
    table.uuid(ITEM_ITEMS.author_id).references('id').inTable(TABLES.authors)

    table.timestamps(true, true)
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {}
