const Joi = require('joi')

const ITEM_SEARCH_QUERY_MODEL = Joi.object({
  search: Joi.string().required(),
  type: Joi.string().required(),
}).label('ItemSearchQuery')

const ITEM_CREATE_PAYLOAD_MODEL = Joi.object({
  type: Joi.string().required(),
  name: Joi.string().required(),
}).label('ItemCreatePayload')

const ITEM_SEARCH_MODEL = Joi.array()
  .items(
    Joi.object({
      name: Joi.string().required(),
      slug: Joi.string().required(),
    })
  )
  .label('ItemSearch')

const ITEM_MODEL = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  slug: Joi.string().required(),
  description: Joi.alternatives().try(Joi.string(), Joi.allow(null)),
  release_year: Joi.alternatives().try(Joi.string(), Joi.allow(null)),
  type: Joi.string().required(),
  author_id: Joi.string().required(),
  status: Joi.string().required(),
  created_at: Joi.date().required(),
  updated_at: Joi.date().required(),
}).label('Item')

module.exports = {
  ITEM_MODEL,
  ITEM_SEARCH_MODEL,
  ITEM_SEARCH_QUERY_MODEL,
  ITEM_CREATE_PAYLOAD_MODEL,
}
