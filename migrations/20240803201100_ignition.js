const { AUTHOR } = require('../entities/author')
const { TAG } = require('../entities/tag')
const { COMPANY_HISTORY, COMPANY } = require('../entities/company')
const {
  GAME,
  GAME_HISTORY,
  GAME_MACHINE,
  GAME_MACHINE_MEDIA,
  GAME_TYPE_RELATION,
} = require('../entities/game')
const {
  MACHINE,
  MACHINE_HISTORY,
  MACHINE_MEDIA,
} = require('../entities/machine')
const { MEDIA } = require('../entities/media')
const { TABLES } = require('../utils/constants')
const { GAME_TYPE_HISTORY, GAME_TYPE } = require('../entities/game-type')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  // ===== GESTION DES AUTEURS  ========================
  await knex.schema.createTable(TABLES.authors, (table) => {
    table.uuid(AUTHOR.id).primary()
    table.string(AUTHOR.provider_id).notNullable()
    table.string(AUTHOR.name).notNullable()
    table.timestamps(true, true)

    table.unique([AUTHOR.name, AUTHOR.provider_id])
    table.index([AUTHOR.name, AUTHOR.id])
  })

  // ===== GESTION DES TAGS  ========================
  await knex.schema.createTable(TABLES.tags, (table) => {
    table.uuid(TAG.id).primary()
    table.string(TAG.name).notNullable()
    table.string(TAG.author_id)

    table.timestamps(true, true)
    table.unique([TAG.name])
  })

  await knex.schema.createTable(TABLES.tag_relations, (table) => {
    table.uuid('id').primary()
    table.uuid('tag_id').references('id').inTable(TABLES.tags).notNullable()
    table.uuid('entity_id').notNullable()
    table.string('entity_type').notNullable()
    table.uuid('author_id').references('id').inTable(TABLES.authors)
    table.timestamps(true, true)
  })

  // ===== GESTION DES COMPAGNIES  ========================

  const companiesRows = (table, history) => {
    table.uuid(COMPANY.id).primary()
    table.string(COMPANY.name).notNullable()
    table.string(COMPANY.slug).notNullable()
    table.text(COMPANY.description)
    table.string(COMPANY.author_id)
    table.string(COMPANY.logo)
    table.string(COMPANY.country)
    table.json(COMPANY.activities)
    table.integer(COMPANY.borned_at)
    table.timestamps(true, true)
    table.unique([COMPANY.slug])

    if (history) {
      table
        .uuid(COMPANY_HISTORY.editor_id)
        .references('id')
        .inTable(TABLES.companies)
      table.integer(COMPANY_HISTORY.version).notNullable()
      table.timestamp(COMPANY_HISTORY.modified_at).defaultTo(knex.fn.now())
    }
  }

  await knex.schema.createTable(TABLES.companies, (table) => {
    companiesRows(table, false)
    table.index([COMPANY.name, COMPANY.id])
  })

  await knex.schema.createTable(TABLES.companies_history, (table) => {
    companiesRows(table, true)
  })

  // ===== GESTION DES MACHINES / JEUX  ========================

  const gameTypesRows = (table, history) => {
    table.uuid(GAME_TYPE.id).primary()
    table.string(GAME_TYPE.name).notNullable()
    table.string(GAME_TYPE.slug).notNullable()
    table.text(GAME_TYPE.description)
    table.timestamps(true, true)
    table.unique([GAME_TYPE.slug])

    if (history) {
      table
        .uuid(GAME_TYPE_HISTORY.type_id)
        .references('id')
        .inTable(TABLES.game_types)
      table.integer(GAME_TYPE_HISTORY.version).notNullable()
      table.timestamp(GAME_TYPE_HISTORY.modified_at).defaultTo(knex.fn.now())
    }
  }

  await knex.schema.createTable(TABLES.game_types, (table) => {
    gameTypesRows(table, false)
  })

  await knex.schema.createTable(TABLES.game_types_history, (table) => {
    gameTypesRows(table, true)
  })

  const gamesRows = (table, history) => {
    table.uuid(GAME.id).primary()
    table.string(GAME.name).notNullable()
    table.string(GAME.slug).notNullable()
    table.integer(GAME.release_year).notNullable()
    table.text(GAME.description)
    table.text(GAME.additionnal_information)
    table.string(GAME.cover_image)
    table.string(GAME.status).defaultTo('draft')
    table.string(GAME.classification_id)
    table.uuid(GAME.editor_id).references('id').inTable(TABLES.companies)
    table.uuid(GAME.developer_id).references('id').inTable(TABLES.companies)
    table.uuid(GAME.author_id).references('id').inTable(TABLES.authors)
    table.timestamps(true, true)
    table.unique([GAME.slug])

    if (history) {
      table.uuid(GAME_HISTORY.game_id).references('id').inTable(TABLES.games)
      table.integer(GAME_HISTORY.version).notNullable()
      table.json(GAME_HISTORY.game_machine).defaultTo('[]')
      table.json(GAME_HISTORY.game_machine_medias).defaultTo('[]')
      table.json(GAME_HISTORY.game_types).defaultTo('[]')
      table.timestamp(GAME_HISTORY.modified_at).defaultTo(knex.fn.now())
    }
  }

  await knex.schema.createTable(TABLES.games, (table) => {
    gamesRows(table, false)
    table.index([GAME.name, GAME.id, GAME.release_year, GAME.status])
  })

  await knex.schema.createTable(TABLES.games_history, (table) => {
    gamesRows(table, true)
  })

  await knex.schema.createTable(TABLES.game_types_relations, (table) => {
    table.uuid(GAME_TYPE_RELATION.id).primary()
    table
      .uuid(GAME_TYPE_RELATION.game_id)
      .references('id')
      .inTable(TABLES.games)
    table
      .uuid(GAME_TYPE_RELATION.type_id)
      .references('id')
      .inTable(TABLES.game_types)
    table
      .uuid(GAME_TYPE_RELATION.author_id)
      .references('id')
      .inTable(TABLES.authors)
    table.timestamps(true, true)
  })

  const machinesRows = (table, history) => {
    table.uuid(MACHINE.id).primary()
    table.string(MACHINE.name).notNullable()
    table.string(MACHINE.slug).notNullable()
    table.string(MACHINE.author_id)
    table.integer(MACHINE.release_year).notNullable()
    table.text(MACHINE.description)
    table.text(MACHINE.additionnal_information)
    table.string(MACHINE.cover_image)
    table
      .uuid(MACHINE.manufacturers_id)
      .references('id')
      .inTable(TABLES.companies)
    table.timestamps(true, true)
    table.unique([MACHINE.slug])

    if (history) {
      table
        .uuid(MACHINE_HISTORY.machine_id)
        .references('id')
        .inTable(TABLES.machines)
      table.integer(MACHINE_HISTORY.version).notNullable()
      table.json(MACHINE_HISTORY.medias).defaultTo('[]')
      table.timestamp(MACHINE_HISTORY.modified_at).defaultTo(knex.fn.now())
    }
  }

  await knex.schema.createTable(TABLES.machines, (table) => {
    machinesRows(table, false)
    table.index([MACHINE.name, MACHINE.id, MACHINE.release_year])
  })

  await knex.schema.createTable(TABLES.machines_history, (table) => {
    machinesRows(table, true)
  })

  // ===== Relation tables =====

  await knex.schema.createTable(TABLES.game_machines, (table) => {
    table.uuid(GAME_MACHINE.id).primary()
    table
      .uuid(GAME_MACHINE.game_id)
      .references('id')
      .inTable(TABLES.games)
      .notNullable()
      .onDelete('CASCADE')
    table
      .uuid(GAME_MACHINE.machine_id)
      .references('id')
      .inTable(TABLES.machines)
      .notNullable()
      .onDelete('CASCADE')
    table.string(GAME_MACHINE.cover_image)
    table.uuid(GAME_MACHINE.author_id).references('id').inTable(TABLES.authors)
    table.timestamps(true, true)
    table.unique([GAME_MACHINE.game_id, GAME_MACHINE.machine_id])
  })

  // ===== Table medias =====

  await knex.schema.createTable(TABLES.medias, (table) => {
    table.uuid(MEDIA.id).primary()
    table.string(MEDIA.url).notNullable()
    table.string(MEDIA.type).notNullable()
    table.integer(MEDIA.size).notNullable()
    table.timestamps(true, true)
  })

  await knex.schema.createTable(TABLES.game_machine_medias, (table) => {
    table.uuid(GAME_MACHINE_MEDIA.id).primary()
    table
      .uuid(GAME_MACHINE_MEDIA.media_id)
      .references('id')
      .inTable(TABLES.medias)
      .notNullable()
      .onDelete('CASCADE')
    table
      .uuid(GAME_MACHINE_MEDIA.game_id)
      .references('id')
      .inTable(TABLES.games)
      .notNullable()
      .onDelete('CASCADE')
    table
      .uuid(GAME_MACHINE_MEDIA.machine_id)
      .references('id')
      .inTable(TABLES.machines)
      .notNullable()
      .onDelete('CASCADE')
    table
      .uuid(GAME_MACHINE_MEDIA.author_id)
      .references('id')
      .inTable(TABLES.authors)
    table.timestamps(true, true)
  })

  await knex.schema.createTable(TABLES.machine_medias, (table) => {
    table.uuid(MACHINE_MEDIA.id).primary()
    table
      .uuid(MACHINE_MEDIA.media_id)
      .references('id')
      .inTable(TABLES.medias)
      .notNullable()
      .onDelete('CASCADE')
    table
      .uuid(MACHINE_MEDIA.machine_id)
      .references('id')
      .inTable(TABLES.machines)
      .notNullable()
      .onDelete('CASCADE')
    table.uuid(MACHINE_MEDIA.author_id).references('id').inTable(TABLES.authors)
    table.timestamps(true, true)
  })

  // ===== Lists tables =====

  await knex.schema.createTable(TABLES.game_lists, (table) => {
    table.uuid('id').primary()
    table.string('name').notNullable()
    table.json('game_ids').notNullable() // Liste des ID de jeux au format JSON
    table.uuid('author_id').references('id').inTable(TABLES.authors)
    table.timestamps(true, true)
  })

  await knex.schema.createTable(TABLES.machine_lists, (table) => {
    table.uuid('id').primary()
    table.string('name').notNullable()
    table.json('machine_ids').notNullable() // Liste des ID de machines au format JSON
    table.uuid('author_id').references('id').inTable(TABLES.authors)
    table.timestamps(true, true)
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  await knex.schema.dropTableIfExists(TABLES.game_lists)
  await knex.schema.dropTableIfExists(TABLES.machine_lists)
  await knex.schema.dropTableIfExists(TABLES.game_machine_medias)
  await knex.schema.dropTableIfExists(TABLES.machine_medias)
  await knex.schema.dropTableIfExists(TABLES.game_machines)
  await knex.schema.dropTableIfExists(TABLES.medias)
  await knex.schema.dropTableIfExists(TABLES.games_history)
  await knex.schema.dropTableIfExists(TABLES.games)
  await knex.schema.dropTableIfExists(TABLES.machines_history)
  await knex.schema.dropTableIfExists(TABLES.machines)
  await knex.schema.dropTableIfExists(TABLES.companies_history)
  await knex.schema.dropTableIfExists(TABLES.companies)
  await knex.schema.dropTableIfExists(TABLES.authors)
}
