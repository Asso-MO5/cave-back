const { getItem } = require('./get-item')

module.exports = async (req, h) => {
  try {
    const item = await getItem(req.params.slug, req, h)
    return h.response(item).type('json')
  } catch (error) {
    console.log('MACHINE GET BY ID :', error)
    return h
      .response({ error: 'Internal server error', details: error })
      .code(500)
  }
}
