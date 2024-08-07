const { TABLES } = require('../utils/constants')
const { ITEMS } = require('../entities/items')
const { COMPANY } = require('../entities/company')
const { ITEM_COMPANIES } = require('../entities/item-company')
const {
  ITEM_LONG_TEXT_ATTRS,
  ITEM_NUMBER_ATTRS,
  ITEM_TEXT_ATTRS,
} = require('../entities/item-attrs')
const { ITEM_MEDIAS } = require('../entities/item-medias')
const { ITEM_TAGS } = require('../entities/item-tags')
const { ITEM_HISTORY } = require('../entities/item-history')
const { MEDIA } = require('../entities/media')
const { TAG } = require('../entities/tag')
const { AUTHOR } = require('../entities/author')

exports.up = async (knex) => {
  await knex.schema.createTable(TABLES.medias, (table) => {
    table.uuid(MEDIA.id).primary()
    table.string(MEDIA.name).notNullable()
    table.string(MEDIA.url).notNullable()
    table.string(MEDIA.alt).notNullable()
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

  await knex.schema.createTable(TABLES.tags, (table) => {
    table.uuid(TAG.id).primary()
    table.string(TAG.name).notNullable()
    table.string(TAG.slug).notNullable()
    table.uuid(TAG.author_id).references('id').inTable(TABLES.authors)
    table.timestamps(true, true)
    table.unique([TAG.slug])
  })

  await knex.schema.createTable(TABLES.items, (table) => {
    table.uuid(ITEMS.id).primary()
    table.string(ITEMS.name).notNullable()
    table.string(ITEMS.slug).notNullable()
    table.text(ITEMS.description)
    table.string(ITEMS.type).notNullable()
    table.string(ITEMS.cover_id).references('id').inTable(TABLES.medias)
    table.uuid(ITEMS.author_id).references('id').inTable(TABLES.authors)
    table.timestamps(true, true)
    table.unique([ITEMS.slug])
  })

  await knex.schema.createTable(TABLES.companies, (table) => {
    table.uuid(COMPANY.id).primary()
    table.string(COMPANY.name).notNullable()
    table.string(COMPANY.slug).notNullable()
    table.text(COMPANY.description)
    table.string(COMPANY.logo_id).references('id').inTable(TABLES.medias)
    table.string(COMPANY.country)
    table.json(COMPANY.activities)
    table.integer(COMPANY.borned_at)
    table.uuid(COMPANY.author_id).references('id').inTable(TABLES.authors)
    table.timestamps(true, true)
    table.unique([COMPANY.slug])
  })

  await knex.schema.createTable(TABLES.item_companies, (table) => {
    table.uuid(ITEM_COMPANIES.id).primary()
    table
      .uuid(ITEM_COMPANIES.item_id)
      .references('id')
      .inTable(TABLES.items)
      .notNullable()
    table
      .uuid(ITEM_COMPANIES.company_id)
      .references('id')
      .inTable(TABLES.companies)
      .notNullable()
    table.string(ITEM_COMPANIES.relation_type).notNullable()
    table
      .uuid(ITEM_COMPANIES.author_id)
      .references('id')
      .inTable(TABLES.authors)
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

  await knex.schema.createTable(TABLES.item_tags, (table) => {
    table.uuid(ITEM_TAGS.id).primary()
    table
      .uuid(ITEM_TAGS.item_id)
      .references('id')
      .inTable(TABLES.items)
      .notNullable()
    table
      .uuid(ITEM_TAGS.tag_id)
      .references('id')
      .inTable(TABLES.tags)
      .notNullable()
    table.uuid(ITEM_TAGS.author_id).references('id').inTable(TABLES.authors)
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
}

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists(TABLES.medias)
  await knex.schema.dropTableIfExists(TABLES.tags)
  await knex.schema.dropTableIfExists(TABLES.item_history)
  await knex.schema.dropTableIfExists(TABLES.item_tags)
  await knex.schema.dropTableIfExists(TABLES.item_medias)
  await knex.schema.dropTableIfExists(TABLES.item_long_text_attrs)
  await knex.schema.dropTableIfExists(TABLES.item_number_attrs)
  await knex.schema.dropTableIfExists(TABLES.item_text_attrs)
  await knex.schema.dropTableIfExists(TABLES.item_companies)
  await knex.schema.dropTableIfExists(TABLES.companies)
  await knex.schema.dropTableIfExists(TABLES.items)
}
