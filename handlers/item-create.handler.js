const Joi = require('joi')
const { getItemByNameAndType, createItems } = require('../entities/items')

module.exports = async (req, h) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().required(),
  })

  const { error, value: item } = schema.validate(req.payload)

  if (error) {
    const details = error.details.map((i) => i.message).join(',')
    return h.response({ error: details }).code(400)
  }

  const ifItemExist = await getItemByNameAndType(item.name, item.type)

  if (ifItemExist)
    return h.response({ error: 'Machine déjà existante' }).code(400)

  try {
    const newItem = await createItems({
      ...item,
      author_id: req.app.user.id,
    })

    console.log('newItem :', newItem)
    return h
      .response({ slug: newItem.slug, id: newItem.id })
      .type('json')
      .code(201)
  } catch (error) {
    console.log('MACHINE CREATE :', error)

    return h
      .response({ error: 'Internal server error', details: error })
      .code(500)
  }
}
