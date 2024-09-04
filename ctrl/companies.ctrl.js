const { paginateCursor } = require('../utils/db')
const { TABLES, ROLES } = require('../utils/constants')
const {
  createCompanies,
  getCompaniesLight,
  getCompanyByName,
  updateCompany,
  COMPANY,
} = require('../entities/company')
const { headers } = require('../models/header.model')
const {
  COMPANY_LIGHT_MODEL,
  COMPANIES_LIGHT_MODEL,
  COMPANIES_LIST_QUERY,
  COMPANY_CREATE_BODY,
  COMPANY_MODEL,
} = require('../models/company.model')

module.exports = [
  {
    method: 'GET',
    path: '/companies/light',
    options: {
      description: 'Récupère la liste des entreprises',
      tags: ['api', 'entreprise'],
      notes: [ROLES.member],
      validate: {
        query: COMPANIES_LIST_QUERY,
        headers,
      },
      response: {
        status: {
          200: COMPANIES_LIGHT_MODEL.required(),
        },
      },
    },
    async handler(req, h) {
      const conditions = []

      if (req.query.activities) {
        conditions.push([
          'activities',
          'like',
          '%' + req.query.activities + '%',
        ])
      }
      const query = await getCompaniesLight(req.query.activities)
      return h.response(query).type('json')
    },
  },
  {
    method: 'GET',
    path: '/companies',

    async handler(req, h) {
      const conditions = []
      if (req.query.activities) {
        conditions.push([
          'activities',
          'like',
          '%' + req.query.activities + '%',
        ])
      }

      const query = await paginateCursor({
        tableName: TABLES.companies,
        pageSize: req.query.limit ? parseInt(req.query.limit) : 10,
        conditions,
        cursor: req.query.cursor,
      })

      return h.response(query).type('json')
    },
  },
  {
    method: 'POST',
    path: '/companies',
    options: {
      description: 'Crée une entreprise',
      tags: ['api', 'entreprise'],
      notes: [ROLES.publisher, ROLES.reviewer],
      validate: {
        payload: COMPANY_CREATE_BODY.required(),
        headers,
      },
      response: {
        status: {
          201: COMPANY_MODEL.required(),
        },
      },
    },
    async handler(req, h) {
      const { error, value: data } = COMPANY_CREATE_BODY.validate(req.payload)
      if (error)
        return h
          .response({ error: error.details.map((i) => i.message).join(',') })
          .code(400)

      const isExist = await getCompanyByName(data.name)

      if (isExist && !isExist.activities.includes(data.activities)) {
        const activities = isExist.activities.split(',')
        activities.push(data.activities)
        isExist.activities = activities.join(',')

        await updateCompany(isExist.id, { activities: isExist.activities })

        const { error } = COMPANY_MODEL.validate({
          ...isExist,
          relation_type: '___',
        })

        if (error) {
          console.error('error', error)
          return h.response({ message: error.message }).code(400)
        }

        return h.response(isExist).type('json').code(200)
      }

      try {
        const newItem = await createCompanies({
          ...data,
          author_id: req.app.user.id,
        })
        const dataSend = {
          ...newItem,
          relation_type: '___',
        }
        const { error } = COMPANY_MODEL.validate({
          ...newItem,
          relation_type: '___',
        })

        if (error) {
          console.error('error', error)
          return h.response({ message: error.message }).code(400)
        }
        return h.response(dataSend).type('json').code(201)
      } catch (error) {
        console.log('company CREATE :', error)
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }
    },
  },
]
