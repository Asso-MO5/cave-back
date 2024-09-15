const { TABLES } = require('../utils/constants')
const { ITEMS } = require('../entities/items')
const {
  ITEM_LONG_TEXT_ATTRS,
  ITEM_NUMBER_ATTRS,
  ITEM_TEXT_ATTRS,
} = require('../entities/item-attrs')
const { ITEM_MEDIAS } = require('../entities/item-medias')
const { ITEM_HISTORY } = require('../entities/item-history')
const { MEDIA } = require('../entities/media')
const { AUTHOR } = require('../entities/author')
const { ITEM_RELATION } = require('../entities/item-relations')

exports.up = async (knex) => {
  await knex.schema.createTable(TABLES.medias, (table) => {
    table.uuid(MEDIA.id).primary()
    table.string(MEDIA.name).notNullable()
    table.string(MEDIA.url).notNullable()
    table.string(MEDIA.alt).notNullable()
    table.integer(MEDIA.size).notNullable()
    table.text(MEDIA.description)
    table.string(MEDIA.type).notNullable()
    table.timestamps(true, true)
    table.unique([MEDIA.url])
  })

  await knex.schema.createTable(TABLES.authors, (table) => {
    table.uuid(AUTHOR.id).primary()
    table.string(AUTHOR.name).notNullable()
    table.string(AUTHOR.provider_id).notNullable()
    table.timestamps(true, true)
    table.unique([AUTHOR.provider_id])
  })

  await knex.schema.createTable(TABLES.items, (table) => {
    table.uuid(ITEMS.id).primary()
    table.string(ITEMS.name).notNullable()
    table.string(ITEMS.type).notNullable()
    table.string(ITEMS.status).notNullable().defaultTo('draft')
    table.uuid(ITEMS.author_id).references('id').inTable(TABLES.authors)
    table.timestamps(true, true)
  })

  await knex.schema.createTable(TABLES.item_text_attrs, (table) => {
    table.uuid(ITEM_TEXT_ATTRS.id).primary()
    table
      .uuid(ITEM_TEXT_ATTRS.item_id)
      .references('id')
      .inTable(TABLES.items)
      .notNullable()
    table.string(ITEM_TEXT_ATTRS.key).notNullable()
    table.text(ITEM_TEXT_ATTRS.value).notNullable()
    table
      .uuid(ITEM_TEXT_ATTRS.author_id)
      .references('id')
      .inTable(TABLES.authors)
    table.timestamps(true, true)
  })

  await knex.schema.createTable(TABLES.item_number_attrs, (table) => {
    table.uuid(ITEM_NUMBER_ATTRS.id).primary()
    table
      .uuid(ITEM_NUMBER_ATTRS.item_id)
      .references('id')
      .inTable(TABLES.items)
      .notNullable()
    table.string(ITEM_NUMBER_ATTRS.key).notNullable()
    table.integer(ITEM_NUMBER_ATTRS.value).notNullable()
    table
      .uuid(ITEM_NUMBER_ATTRS.author_id)
      .references('id')
      .inTable(TABLES.authors)
    table.timestamps(true, true)
  })

  await knex.schema.createTable(TABLES.item_long_text_attrs, (table) => {
    table.uuid(ITEM_LONG_TEXT_ATTRS.id).primary()
    table
      .uuid(ITEM_LONG_TEXT_ATTRS.item_id)
      .references('id')
      .inTable(TABLES.items)
      .notNullable()
    table.string(ITEM_LONG_TEXT_ATTRS.key).notNullable()
    table.text(ITEM_LONG_TEXT_ATTRS.value).notNullable()
    table
      .uuid(ITEM_LONG_TEXT_ATTRS.author_id)
      .references('id')
      .inTable(TABLES.authors)
    table.timestamps(true, true)
  })

  await knex.schema.createTable(TABLES.item_medias, (table) => {
    table.uuid(ITEM_MEDIAS.id).primary()
    table
      .uuid(ITEM_MEDIAS.item_id)
      .references('id')
      .inTable(TABLES.items)
      .notNullable()
    table
      .uuid(ITEM_MEDIAS.media_id)
      .references('id')
      .inTable(TABLES.medias)
      .notNullable()
    table.uuid(ITEM_MEDIAS.author_id).references('id').inTable(TABLES.authors)
    table.timestamps(true, true)
  })

  await knex.schema.createTable(TABLES.item_history, (table) => {
    table.uuid(ITEM_HISTORY.id).primary()
    table
      .uuid(ITEM_HISTORY.item_id)
      .references('id')
      .inTable(TABLES.items)
      .notNullable()
    table.integer(ITEM_HISTORY.version).notNullable()
    table.json(ITEM_HISTORY.changes).notNullable()
    table.timestamp(ITEM_HISTORY.modified_at).defaultTo(knex.fn.now())
    table.uuid(ITEM_HISTORY.author_id).references('id').inTable(TABLES.authors)
  })

  await knex.schema.createTable(TABLES.item_relation, (table) => {
    table.uuid(ITEM_RELATION.id).primary()
    table
      .uuid(ITEM_RELATION.item_ref_id)
      .references('id')
      .inTable(TABLES.items)
      .notNullable()

    table
      .uuid(ITEM_RELATION.item_relation_id)
      .references('id')
      .inTable(TABLES.items)
      .notNullable()
    table.string(ITEM_RELATION.relation_type).notNullable()
    table.uuid(ITEM_RELATION.author_id).references('id').inTable(TABLES.authors)

    table.timestamps(true, true)
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists(TABLES.medias)
  await knex.schema.dropTableIfExists(TABLES.item_history)
  await knex.schema.dropTableIfExists(TABLES.item_medias)
  await knex.schema.dropTableIfExists(TABLES.item_relation)
  await knex.schema.dropTableIfExists(TABLES.item_long_text_attrs)
  await knex.schema.dropTableIfExists(TABLES.item_number_attrs)
  await knex.schema.dropTableIfExists(TABLES.item_text_attrs)
  await knex.schema.dropTableIfExists(TABLES.items)
}
