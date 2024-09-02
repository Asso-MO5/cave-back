const Joi = require('joi')
const { ITEM_MODEL } = require('./item.model')

const EXPO_MODEL = ITEM_MODEL.keys({
  cartelModel: Joi.string().required(),
  medias: Joi.array().items(Joi.object().unknown()).required(),
}).label('Expo')

const EXPOS_MODEL = Joi.array()
  .items(
    Joi.object({
      name: Joi.string().required(),
      slug: Joi.string().required(),
      status: Joi.string(),
    }).label('ExpoForList')
  )
  .label('ExpoList')

module.exports = {
  EXPO_MODEL,
  EXPOS_MODEL,
}
