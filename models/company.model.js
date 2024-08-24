const Joi = require('joi')

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

module.exports = {
  COMPANY_MODEL,
}
