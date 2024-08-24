const { ITEM_MODEL } = require('./item.model')
const Joi = require('joi')
const { COMPANY_MODEL } = require('./company.model')

const GAME_MODEL = ITEM_MODEL.keys({
  ref_id: Joi.string().required(),
  machine: Joi.alternatives().try(
    ITEM_MODEL.keys({
      item_ref_id: Joi.string(),
    }),
    Joi.allow(null)
  ),

  developer: COMPANY_MODEL,
  publisher: COMPANY_MODEL,
  medias: Joi.array().items(Joi.object().unknown()).required(), // TODO Media
}).label('Game')

module.exports = {
  GAME_MODEL,
}
