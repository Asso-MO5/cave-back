const Joi = require('joi')

const HEADER_MODEL = Joi.object({
  authorization: Joi.string().required(),
}).label('Header')

const headers = Joi.object({
  authorization: Joi.string().required(),
}).unknown()

module.exports = {
  HEADER_MODEL,
  headers,
}
