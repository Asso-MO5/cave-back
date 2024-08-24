const { getItems } = require('../entities/items')

module.exports = async (req, h) => {
  try {
    const items = await getItems(req.query.type)
    console.log('GET ITEMS :', items)

    const res = items.reduce((acc, item) => {
      const isExist = acc.findIndex((i) => i.name === item.name)
      if (isExist === -1) {
        acc.push({
          name: item.name,
          slug: item.slug,
          release_year: item.release_year,
          [item.relation_type]: item.company_name,
        })
      } else {
        acc[isExist][item.relation_type] = item.company_name
      }
      return acc
    }, [])

    return h.response(res).type('json')
  } catch (error) {
    console.log('GET ITEMS :', error)
    return h
      .response({ error: 'Internal server error', details: error })
      .code(500)
  }
}
