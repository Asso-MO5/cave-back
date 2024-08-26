const { paginateCursor } = require('../utils/db')
const { TABLES, ROLES } = require('../utils/constants')
const {
  createCompanies,
  getCompaniesLight,
  getCompanyByName,
  updateCompany,
} = require('../entities/company')
const { headers } = require('../models/header.model')
const Joi = require('joi')

module.exports = [
  {
    method: 'GET',
    path: '/companies/light',
    options: {
      description: 'Récupère la liste des entreprises',
      tags: ['api', 'entreprise'],
      notes: [ROLES.member],
      validate: {
        query: Joi.object({
          activities: Joi.string().allow(''),
          limit: Joi.number().integer().min(1).max(100000).default(10),
        }).label('CompanyListLightQuery'),
        headers,
      },
      response: {
        status: {
          200: Joi.array()
            .items(
              Joi.object({
                id: Joi.string().required(),
                name: Joi.string().required(),
                slug: Joi.string().required(),
              }).label('CompanyLight')
            )
            .label('CompaniesLight')
            .required(),
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
      payload: {
        parse: true,
        output: 'stream',
        multipart: true,
        maxBytes: 800 * 1024 * 1024, //800 mb
      },
    },
    async handler(req, h) {
      const data = req.payload

      const isExist = await getCompanyByName(data.name)

      if (isExist && !isExist.activities.includes(data.activities)) {
        const activities = isExist.activities.split(',')
        activities.push(data.activities)
        isExist.activities = activities.join(',')

        await updateCompany(isExist.id, { activities: isExist.activities })

        return h.response(isExist).type('json').code(200)
      }

      console.log('isExist :', req.app.user)
      try {
        const newItem = await createCompanies({
          ...data,
          author_id: req.app.user.id,
        })
        return h.response(newItem).type('json').code(201)
      } catch (error) {
        console.log('company CREATE :', error)
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }
    },
  },
]
