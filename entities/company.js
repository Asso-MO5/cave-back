const { knex } = require('../utils/db')
const { v4: uuidv4 } = require('uuid')
const { TABLES } = require('../utils/constants')
const { getSlug } = require('../utils/get-slug')
const { ITEM_COMPANIES } = require('./item-company')
const { MEDIA } = require('./media')

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

const COMPANY_ACTIVITIES = {
  manufacturer: 'manufacturer',
  publisher: 'publisher',
  developer: 'developer',
  distributor: 'distributor',
  retailer: 'retailer',
  other: 'other',
  association: 'association',
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
  COMPANY_ACTIVITIES,
  async getCompaniesLight(activities = '') {
    return await knex(TABLES.companies)
      .where(COMPANY.activities, 'like', '%' + activities + '%')
      .orderBy(COMPANY.name)
      .select(COMPANY.id, COMPANY.name, COMPANY.slug, COMPANY.activities)
  },
  async getCompanyWithGame(itemId) {
    return await knex(TABLES.companies)
      .leftJoin(
        TABLES.item_companies,
        `${TABLES.companies}.${COMPANY.id}`,
        '=',
        `${TABLES.item_companies}.${ITEM_COMPANIES.company_id}`
      )
      .where(`${TABLES.item_companies}.${ITEM_COMPANIES.item_id}`, itemId)
      .select(
        TABLES.companies + '.' + COMPANY.id,
        TABLES.companies + '.' + COMPANY.name,
        TABLES.item_companies + '.' + ITEM_COMPANIES.relation_type
      )
  },
  async createCompanies(company) {
    let slug = getSlug(company.name)
    const endIsNumber = slug.match(/-\d+$/)
    if (endIsNumber) slug = slug.replace(/-\d+$/, '')

    const existslugs = await knex(TABLES.companies)
      .where('slug', 'like', `${slug}%`)
      .count('* as count')
      .first()

    if (existslugs.count > 0) slug = slug + '-' + (existslugs.count + 1)

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
        slug,
        created_at: new Date(),
        updated_at: new Date(),
      }
      await knex(TABLES.companies).insert(newCompany)

      return newCompany
    } catch (error) {
      console.log('MEDIA CREATE :', error)
    }
  },
  async getCompaniesByItemId(itemId) {
    return await knex(TABLES.companies)
      .leftJoin(
        TABLES.item_companies,
        `${TABLES.companies}.${COMPANY.id}`,
        '=',
        `${TABLES.item_companies}.${ITEM_COMPANIES.company_id}`
      )
      .where(`${TABLES.item_companies}.${ITEM_COMPANIES.item_id}`, itemId)
      .select(
        TABLES.companies + '.*',
        TABLES.item_companies + '.' + ITEM_COMPANIES.relation_type
      )
  },
  async getCompanyById(companyId) {
    return await knex(TABLES.companies).where(COMPANY.id, companyId).first()
  },
  async getCompanyBySlug(slug) {
    const baseQuery = knex(TABLES.companies).where({
      [TABLES.companies + '.' + COMPANY.slug]: slug,
    })

    baseQuery
      .leftJoin(
        TABLES.medias,
        TABLES.medias + '.' + MEDIA.id,
        '=',
        TABLES.companies + '.' + COMPANY.logo_id
      )
      .select(
        TABLES.companies + '.*',
        TABLES.medias + '.' + MEDIA.url + ' as logo_url'
      )

    return await baseQuery.first()
  },
  async getCompanyByName(name) {
    try {
      return await knex(TABLES.companies).where(COMPANY.name, name).first()
    } catch (error) {
      console.log('GET COMPANY BY NAME :', error)
    }
  },
  async updateCompany(companyId, partial) {
    try {
      await knex(TABLES.companies).where(COMPANY.id, companyId).update(partial)
    } catch (error) {
      console.log('COMPANY UPDATE :', error)
    }
  },
}
