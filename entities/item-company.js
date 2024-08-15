const { knex } = require('../utils/db')
const { v4: uuidv4 } = require('uuid')
const { TABLES } = require('../utils/constants')

const ITEM_COMPANIES = {
  id: 'id',
  item_id: 'item_id',
  company_id: 'company_id',
  relation_type: 'relation_type', // e.g., 'manufacturer', 'developer'
  created_at: 'created_at',
  updated_at: 'updated_at',
  author_id: 'author_id',
}

module.exports = {
  ITEM_COMPANIES,
  async createItemCompany(itemCompany) {
    const itemCompanyExists = await knex(TABLES.item_companies)
      .where(ITEM_COMPANIES.item_id, itemCompany.item_id)
      .andWhere(ITEM_COMPANIES.company_id, itemCompany.company_id)
      .first()

    if (itemCompanyExists) return itemCompanyExists
    const newCompany = {
      id: uuidv4(),
      item_id: itemCompany.item_id,
      company_id: itemCompany.company_id,
      relation_type: itemCompany.relation_type,
      author_id: itemCompany.author_id,
      created_at: new Date(),
      updated_at: new Date(),
    }
    await knex(TABLES.item_companies).insert(newCompany)
    return newCompany
  },
}
