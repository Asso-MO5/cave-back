const { paginateCursor } = require('../utils/db')
const { TABLES, ROLES } = require('../utils/constants')
const {
  createCompanies,
  getCompaniesLight,
  getCompanyByName,
  updateCompany,
  getCompanyBySlug,
  getCompanyById,
  deleteCompany,
} = require('../entities/company')
const { headers } = require('../models/header.model')
const {
  COMPANIES_LIGHT_MODEL,
  COMPANIES_LIST_QUERY,
  COMPANY_CREATE_BODY,
  COMPANY_MODEL,
  COMPANY_BY_SLUG_QUERY,
} = require('../models/company.model')
const { getMediaUrl } = require('../utils/media-url')
const { createOrUpdateCompanyLogo } = require('../entities/company_medias')
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
    method: 'GET',
    path: '/companies/{slug}',
    options: {
      description: 'Récupère une entreprise par son slug',
      tags: ['api', 'entreprise'],
      notes: [ROLES.member],
      validate: {
        params: COMPANY_BY_SLUG_QUERY.required(),

        headers,
      },
      response: {
        status: {
          200: COMPANY_MODEL.required(),
        },
      },
    },

    async handler(req, h) {
      const { slug } = req.params
      const _company = await getCompanyBySlug(slug)

      // Legacy
      const keys = Object.keys(_company)
      if (keys.includes('logo_id')) delete _company.logo_id

      const company = {
        ..._company,
        relation_type: '___',
        medias: _company.medias.map((m) => ({
          id: m.id,
          name: m.name,
          type: m.type,
          relation_type: m.relation_type,
          url: getMediaUrl(m.url, req),
        })),
      }

      const { error } = COMPANY_MODEL.validate(company)

      if (error) return h.response({ message: error.message }).code(400)
      return h.response(company).type('json')
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

        const res = {
          ...isExist,
          relation_type: '___',
          medias: [],
        }

        if (Object.keys(res).includes('logo_id')) delete res.logo_id
        const { error } = COMPANY_MODEL.validate(res)

        if (error) {
          console.error('error', error)
          return h.response({ message: error.message }).code(400)
        }

        return h.response(res).type('json').code(200)
      }
      try {
        const newItem = await createCompanies({
          ...data,
          author_id: req.app.user.id,
        })

        if (Object.keys(newItem).includes('logo_id')) delete newItem.logo_id
        const dataSend = {
          ...newItem,
          relation_type: '___',
          medias: [],
        }

        const { error } = COMPANY_MODEL.validate(dataSend)

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
  {
    method: 'PUT',
    path: '/companies/{id}',

    options: {
      description: 'Modifie une entreprise',
      tags: ['api', 'entreprise'],
      notes: [ROLES.publisher, ROLES.reviewer],
      validate: {
        headers,
      },
      notes: [ROLES.reviewer, ROLES.publisher],
      payload: {
        parse: true,
        output: 'stream',
        multipart: true,
        maxBytes: 800 * 1024 * 1024, //800 mb
      },
    },
    async handler(req, h) {
      const data = req.payload
      const oldCompany = await getCompanyById(req.params.id)
      if (!oldCompany) return h.response({ error: 'Non trouvé' }).code(404)

      if (data.status)
        return h
          .response({
            error: 'Vous ne pouvez pas modifier le status via cette route',
          })
          .code(400)

      // ====== LOGO ==========================================================

      try {
        //  await createComp(oldCompany.id)
      } catch (error) {
        console.log('ITEM HISTORY :', error)
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }

      if (data.logo && data.cover?.hapi?.filename) {
        const [logo] = await createMedia([data.cover])

        oldCompany.logo_id = logo.id
        try {
          await createOrUpdateCompanyLogo(
            oldCompany.id,
            logo.id,
            req.app.user.id
          )
        } catch (error) {
          return h
            .response({ error: 'Internal server error', details: error })
            .code(500)
        }

        oldCompany.logo_url = getMediaUrl(logo.url, req)

        return h.response(oldCompany).code(201)
      }

      if (data.logo_id) {
        try {
          await createOrUpdateCompanyLogo(
            oldCompany.id,
            data.logo_id,
            req.app.user.id
          )
        } catch (error) {
          return h
            .response({ error: 'Internal server error', details: error })
            .code(500)
        }

        return h.response(oldCompany).code(201)
      }

      if (data.logo_url && data.logo_url.includes('http')) {
        const file = await getMediaFromUrl(data.logo_url)
        const [logo] = await createMedia([file])
        oldCompany.logo_id = logo.id
        try {
          await createOrUpdateCompanyLogo(
            oldCompany.id,
            logo.id,
            req.app.user.id
          )
        } catch (error) {
          return h
            .response({
              error: 'Internal server error',
              details: error,
            })
            .code(500)
        }

        oldCompany.logo_url = getMediaUrl(logo.url, req)

        return h.response(oldCompany).code(201)
      }

      try {
        await updateCompany(oldCompany.id, {
          ...data,
          author_id: req.app.user.id,
        })
      } catch (error) {
        console.log('ITEM UPDATE :', error)
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }

      return h.response(oldCompany).code(201)
    },
  },
  {
    method: 'DELETE',
    path: '/companies/{id}',
    options: {
      description: 'Supprime une entreprise',
      tags: ['api', 'entreprise'],
      notes: [ROLES.publisher, ROLES.reviewer],
      validate: {
        headers,
      },
      response: {
        status: {
          //201 for send message
          201: Joi.object({
            message: Joi.string().required(),
          })
            .label('DeleteCompanyModel')
            .required(),
        },
      },
    },
    async handler(req, h) {
      try {
        await deleteCompany(req.params.id)
        return h
          .response({
            message: 'Entreprise supprimée',
          })
          .code(201)
      } catch (error) {
        console.log('DELETE COMPANY :', error)
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }
    },
  },
]
