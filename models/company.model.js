const Joi = require('joi')

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

// ===== GET ========================================
const COMPANY_MODEL = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  slug: Joi.string().required(),
  country: Joi.alternatives().try(Joi.string(), Joi.allow(null)),
  description: Joi.alternatives().try(Joi.string(), Joi.allow(null)),
  borned_at: Joi.alternatives().try(Joi.number().integer(), Joi.allow(null)),
  logo_id: Joi.alternatives().try(Joi.string(), Joi.allow(null)),
  logo_url: Joi.alternatives().try(Joi.string(), Joi.allow(null)),
  activities: Joi.alternatives().try(Joi.string(), Joi.allow(null)),
  author_id: Joi.string().required(),
  relation_type: Joi.string().required(),
  created_at: Joi.date().required(),
  updated_at: Joi.date().required(),
}).label('Company')

const COMPANY_LIGHT_MODEL = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  slug: Joi.string().required(),
}).label('CompanyLight')

const COMPANIES_LIGHT_MODEL = Joi.array()
  .items(COMPANY_LIGHT_MODEL)
  .label('CompaniesLight')

module.exports = {
  COMPANY_MODEL,
  COMPANY_CREATE_BODY,
  COMPANY_LIGHT_MODEL,
  COMPANIES_LIST_QUERY,
  COMPANIES_LIGHT_MODEL,
}
