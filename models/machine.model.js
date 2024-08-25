const Joi = require('joi')
const { ITEM_MODEL } = require('./item.model')
const { COMPANY_MODEL } = require('./company.model')

const MACHINE_MODEL = ITEM_MODEL.keys({
  manufacturer: COMPANY_MODEL,
  medias: Joi.array().items(Joi.object().unknown()).required(), // TODO Media
}).label('Machine')

const MACHINES_MODEL = Joi.array()
  .items(
    Joi.object({
      name: Joi.string().required(),
      slug: Joi.string().required(),
      release_year: Joi.alternatives().try(
        Joi.number().integer(),
        Joi.allow(null)
      ),
      manufacturer: Joi.alternatives().try(Joi.string(), Joi.allow(null)),
    }).label('MachineForList')
  )
  .label('MachineList')
  .required()

module.exports = {
  MACHINES_MODEL,
  MACHINE_MODEL,
}
