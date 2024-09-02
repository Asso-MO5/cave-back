const Joi = require('joi')
const { ITEM_MODEL } = require('./item.model')
const { COMPANY_MODEL } = require('./company.model')

const MACHINE_LIGHT_MODEL = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  related_item_id: Joi.alternatives().try(Joi.string(), Joi.allow(null)),
}).label('MachineLight')

const MACHINE_LIGHT_LIST_MODEL = Joi.array()
  .items(MACHINE_LIGHT_MODEL)
  .label('MachineLightList')

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
      status: Joi.string(),
    }).label('MachineForList')
  )
  .label('MachineList')

module.exports = {
  MACHINE_MODEL,
  MACHINES_MODEL,
  MACHINE_LIGHT_MODEL,
  MACHINE_LIGHT_LIST_MODEL,
}
