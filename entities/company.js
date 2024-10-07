const { knex } = require('../utils/db')
const { TABLES } = require('../utils/constants')
const { ITEMS } = require('./items')

module.exports = {
  async getCompanyByName(name) {
    try {
      const baseCompany_ = await knex(TABLES.items)
        .where(ITEMS.name, name)
        .first()

      if (!baseCompany_) return null
      const baseCompany = { ...baseCompany_ }
      const sameCompanies = await knex(TABLES.items)
        .where(ITEMS.name, baseCompany.name)
        .select(ITEMS.id, ITEMS.name, ITEMS.type, ITEMS.status)

      const additionalTextAttrs = await knex(TABLES.item_text_attrs)
        .where({ item_id: id })
        .select('key as attr', 'value')

      const additionalLongTextAttrs = await knex(TABLES.item_long_text_attrs)
        .where({ item_id: id })
        .select('key as attr', 'value')
      const additionalNumberAttrs = await knex(TABLES.item_number_attrs)
        .where({ item_id: id })
        .select('key as attr', 'value')

      const attrs = [
        ...additionalTextAttrs,
        ...additionalLongTextAttrs,
        ...additionalNumberAttrs,
      ]

      attrs.forEach((attr) => {
        if (attr.attr.match(/description/))
          baseCompany[attr.attr] = JSON.parse(attr.value)
        else baseCompany[attr.attr] = attr.value
      })

      baseCompany.medias = await knex(TABLES.item_medias)
        .where({ item_id: id })
        .join(TABLES.medias, 'medias.id', '=', 'item_medias.media_id')
        .select(
          'medias.id',
          'medias.url',
          'medias.alt',
          'medias.type',
          'item_medias.relation_type',
          'item_medias.position'
        )

      return {
        ...baseCompany,
        alternatives: sameCompanies,
      }
    } catch (e) {
      console.error(e)
      return null
    }
  },
  async getCompanyById(id) {
    try {
      const baseCompany_ = await knex(TABLES.items).where(ITEMS.id, id).first()

      if (!baseCompany_) return null
      const baseCompany = { ...baseCompany_ }
      const sameCompanies = await knex(TABLES.items)
        .where(ITEMS.name, baseCompany.name)
        .select(ITEMS.id, ITEMS.name, ITEMS.type, ITEMS.status)

      const additionalTextAttrs = await knex(TABLES.item_text_attrs)
        .where({ item_id: id })
        .select('key as attr', 'value')

      const additionalLongTextAttrs = await knex(TABLES.item_long_text_attrs)
        .where({ item_id: id })
        .select('key as attr', 'value')
      const additionalNumberAttrs = await knex(TABLES.item_number_attrs)
        .where({ item_id: id })
        .select('key as attr', 'value')

      const attrs = [
        ...additionalTextAttrs,
        ...additionalLongTextAttrs,
        ...additionalNumberAttrs,
      ]

      attrs.forEach((attr) => {
        if (attr.attr.match(/description/))
          baseCompany[attr.attr] = JSON.parse(attr.value)
        else baseCompany[attr.attr] = attr.value
      })

      baseCompany.medias = await knex(TABLES.item_medias)
        .where({ item_id: id })
        .join(TABLES.medias, 'medias.id', '=', 'item_medias.media_id')
        .select(
          'medias.id',
          'medias.url',
          'medias.alt',
          'medias.type',
          'item_medias.relation_type',
          'item_medias.position'
        )

      return {
        ...baseCompany,
        alternatives: sameCompanies,
      }
    } catch (e) {
      console.error(e)
      return null
    }
  },
}
