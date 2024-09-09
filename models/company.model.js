const Joi = require('joi')
const media = require('../entities/media')

// ===== BODY ========================================

const COMPANY_CREATE_BODY = Joi.object({
  name: Joi.string().required(),
  activities: Joi.string().required(),
}).label('CompanyCreateBody')

// ===== QUERY ========================================
const COMPANIES_LIST_QUERY = Joi.object({
  activities: Joi.string().allow(''),
  limit: Joi.number().integer().min(1).max(100000).default(10),
}).label('CompanyListQuery')

const COMPANY_BY_SLUG_QUERY = Joi.object({
  slug: Joi.string().required(),
}).label('CompanyBySlugQuery')

// ===== GET ========================================
const COMPANY_MODEL = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  slug: Joi.string().required(),
  country: Joi.alternatives().try(Joi.string(), Joi.allow(null)),
  description: Joi.alternatives().try(Joi.string(), Joi.allow(null)),
  borned_at: Joi.alternatives().try(Joi.string(), Joi.allow(null)),
  activities: Joi.alternatives().try(Joi.string(), Joi.allow(null)),
  author_id: Joi.string().required(),
  relation_type: Joi.string().required(),
  created_at: Joi.date().required(),
  updated_at: Joi.date().required(),
  medias: Joi.array().items(Joi.object().unknown()).required(), // TODO Media
}).label('Company')

const COMPANY_LIGHT_MODEL = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  slug: Joi.string().required(),
  activities: Joi.string().required(),
}).label('CompanyLight')

const COMPANIES_LIGHT_MODEL = Joi.array()
  .items(COMPANY_LIGHT_MODEL)
  .label('CompaniesLight')

module.exports = {
  COMPANY_MODEL,
  COMPANY_LIGHT_MODEL,
  COMPANY_CREATE_BODY,
  COMPANIES_LIST_QUERY,
  COMPANIES_LIGHT_MODEL,
  COMPANY_BY_SLUG_QUERY,
}
