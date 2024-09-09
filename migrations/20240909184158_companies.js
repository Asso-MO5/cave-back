const { COMPANY_MEDIAS } = require('../entities/company_medias')
const { ITEM_MEDIAS } = require('../entities/item-medias')
const { TABLES } = require('../utils/constants')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(TABLES.company_medias, (table) => {
    table.uuid(COMPANY_MEDIAS.id).primary()
    table
      .uuid(COMPANY_MEDIAS.company_id)
      .references('id')
      .inTable(TABLES.companies)
      .notNullable()
    table
      .uuid(COMPANY_MEDIAS.media_id)
      .references('id')
      .inTable(TABLES.medias)
      .notNullable()
    table.string(COMPANY_MEDIAS.relation_type).defaultTo('image')
    table
      .uuid(COMPANY_MEDIAS.author_id)
      .references('id')
      .inTable(TABLES.authors)
    table.timestamps(true, true)
  })

  await knex.schema.alterTable(TABLES.item_medias, (table) => {
    table.string(ITEM_MEDIAS.relation_type).after(ITEM_MEDIAS.media_id)
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {}
