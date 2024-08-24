const Joi = require('joi')

const ITEM_MODEL = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  slug: Joi.string().required(),
  description: Joi.alternatives().try(Joi.string(), Joi.allow(null)),
  release_year: Joi.alternatives().try(Joi.number().integer(), Joi.allow(null)),
  cover_id: Joi.alternatives().try(Joi.string(), Joi.allow(null)),
  cover_url: Joi.alternatives().try(Joi.string(), Joi.allow(null)),
  type: Joi.string().required(),
  author_id: Joi.string().required(),
  status: Joi.string().required(),
  created_at: Joi.date().required(),
  updated_at: Joi.date().required(),
}).label('Item')

module.exports = {
  ITEM_MODEL,
}
