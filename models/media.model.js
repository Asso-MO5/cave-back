const Joi = require('joi')

const MEDIAS_QUERY_MODEL = Joi.object({
  search: Joi.alternatives().try(Joi.string(), Joi.allow(null)),
}).label('MediasLightQuery')

const MEDIA_MODEL_LIGHT = Joi.object({
  id: Joi.string().required(),
  url: Joi.string().required(),
  name: Joi.string().required(),
  type: Joi.string().required(),
}).label('MediaLight')

const MEDIA_MODEL = Joi.object({
  id: Joi.string().required(),
  url: Joi.string().required(),
  name: Joi.string().required(),
  type: Joi.string().required(),
  alt: Joi.string().required(),
  size: Joi.number().required(),
  description: Joi.alternatives().try(Joi.string(), Joi.allow(null)),
}).label('Media')

const MEDIAS_MODEL = Joi.array()
  .items(MEDIA_MODEL_LIGHT)
  .label('MediaLightList')

const MEDIA_CREATE_PAYLOAD_MODEL = Joi.object({
  file: Joi.any()
    .meta({ swaggerType: 'file' })
    .description('Le fichier à uploader')
    .optional(),
  url: Joi.string().uri().description("L'URL du média").optional(),
})
  .xor('file', 'url')
  .label('MediaCreateBody')

module.exports = {
  MEDIA_MODEL,
  MEDIAS_MODEL,
  MEDIA_MODEL_LIGHT,
  MEDIAS_QUERY_MODEL,
  MEDIA_CREATE_PAYLOAD_MODEL,
}
