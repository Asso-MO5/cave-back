const Joi = require('joi')
const { ITEM_MODEL } = require('./item.model')

const CARTEL_CREATE_PAYLOAD_MODEL = Joi.object({
  name: Joi.string(),
  id: Joi.string(),
}).label('CartelCreatePayload')

const CARTEL_MODEL = ITEM_MODEL.keys({
  cartelModel: Joi.string().required(),
  medias: Joi.array().items(Joi.object().unknown()).required(),
}).label('Expo')

const CARTELS_MODEL = Joi.array()
  .items(
    Joi.object({
      name: Joi.string().required(),
      slug: Joi.string().required(),
      type: Joi.string().required(),
      status: Joi.string(),
    }).label('CartelForList')
  )
  .label('CartelList')

module.exports = {
  CARTEL_MODEL,
  CARTELS_MODEL,
  CARTEL_CREATE_PAYLOAD_MODEL,
}
