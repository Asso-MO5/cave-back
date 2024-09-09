const { ITEM_MODEL } = require('./item.model')
const Joi = require('joi')
const { COMPANY_MODEL } = require('./company.model')

const GAME_MODEL = ITEM_MODEL.keys({
  ref_id: Joi.string().required(),
  machine: Joi.alternatives().try(
    ITEM_MODEL.keys({
      item_ref_id: Joi.string(),
    }).label('MachineInGame'),
    Joi.allow(null)
  ),
  developer: COMPANY_MODEL,
  publisher: COMPANY_MODEL,
  medias: Joi.array().items(Joi.object().unknown()).required(), // TODO Media
}).label('Game')

const GAMES_MODEL = Joi.array()
  .items(
    Joi.object({
      name: Joi.string().required(),
      slug: Joi.string().required(),
      release_year: Joi.alternatives().try(
        Joi.number().integer(),
        Joi.allow(null)
      ),
      status: Joi.string(),
      publisher: Joi.alternatives().try(Joi.string(), Joi.allow(null)),
      developer: Joi.alternatives().try(Joi.string(), Joi.allow(null)),
    }).label('GameForList')
  )
  .label('GameList')

module.exports = {
  GAME_MODEL,
  GAMES_MODEL,
}
