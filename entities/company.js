const { knex } = require('../utils/db')
const { v4: uuidv4 } = require('uuid')
const { TABLES } = require('../utils/constants')
const { getSlug } = require('../utils/get-slug')

const COMPANY = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  logo_id: 'logo_id',
  country: 'country',
  activities: 'activities',
  author_id: 'author_id',
  borned_at: 'borned_at',
  created_at: 'created_at',
  updated_at: 'updated_at',
}

const COMPANY_HISTORY = {
  ...COMPANY,
  editor_id: 'editor_id',
  version: 'version',
  modified_at: 'modified_at',
}

module.exports = {
  COMPANY,
  COMPANY_HISTORY,
  async createCompanies(company) {
    try {
      const id = uuidv4()
      const newCompany = {
        id,
        name: company.name,
        logo_id: company.cover_id || null,
        country: company.country || null,
        activities: company.activities || null,
        author_id: company.author_id,
        description: company.description || null,
        slug: getSlug(company.name),
        created_at: new Date(),
        updated_at: new Date(),
      }
      console.log('newCompany :', newCompany)
      await knex(TABLES.companies).insert(newCompany)

      return newCompany
    } catch (error) {
      console.log('MEDIA CREATE :', error)
    }
  },
}
