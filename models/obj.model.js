const Joi = require('joi')
const { ITEM_MODEL } = require('./item.model')
const { COMPANY_MODEL } = require('./company.model')

// ===== BODY ========================================

// ===== QUERY ========================================

const OBJS_QUERY_MODEL = Joi.object({
  limit: Joi.number().integer().min(1).max(100000).default(10),
}).label('ObjListQuery')

// ===== GET ========================================

const OBJ_MODEL = ITEM_MODEL.keys({
  manufacturer: COMPANY_MODEL,
  medias: Joi.array().items(Joi.object().unknown()).required(), // TODO Media
}).label('Obj')

const OBJS_MODEL = Joi.array()
  .items(
    Joi.object({
      name: Joi.string().required(),
      slug: Joi.string().required(),
      release_year: Joi.alternatives().try(
        Joi.number().integer(),
        Joi.allow(null)
      ),
      manufacturer: Joi.alternatives().try(Joi.string(), Joi.allow(null)),
      status: Joi.string(),
    }).label('ObjForList')
  )
  .label('ObjList')

module.exports = {
  OBJ_MODEL,
  OBJS_MODEL,
  OBJS_QUERY_MODEL,
}
