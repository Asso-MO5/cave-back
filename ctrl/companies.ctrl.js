const { paginateCursor } = require('../utils/db')
const { TABLES, ROLES } = require('../utils/constants')
const {
  createCompanies,
  getCompaniesLight,
  getCompanyByName,
  updateCompany,
  getCompanyBySlug,
  getCompanyById,
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
const { getMedia, getMedias } = require('../entities/media')

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

      const company = {
        ..._company,
        relation_type: '___',
      }

      // ====== LOGO ========================

      if (company.logo_url) {
        company.logo_url = getMediaUrl(company.logo_url, req)
      }

      /*
      try {
        item.medias = (await getMediasByItemId(item.id)) || []
      } catch (error) {
        console.log('ITEM MEDIAS GET BY ID :', error)
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }

      */

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
          await updateCompany(oldCompany.id, {
            logo_id_id: cover.id,
            author_id: req.app.user.id,
          })
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
          await updateCompany(oldCompany.id, {
            logo_id: data.logo_id,
            author_id: req.app.user.id,
          })
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
          await updateCompany(oldCompany.id, {
            logo_id: logo.id,
            author_id: req.app.user.id,
          })
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
]
