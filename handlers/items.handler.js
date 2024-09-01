const { getItems } = require('../entities/items')

function getType(path) {
  if (path === '/games') {
    return 'game'
  } else if (path === '/machines') {
    return 'machine'
  } else if (path === '/objs') {
    return 'obj'
  } else {
    return 'list'
  }
}

module.exports = async (req, h) => {
  try {
    const type = getType(req.route.path)
    const items = await getItems(type)

    const res = items.reduce((acc, item) => {
      const isExist = acc.findIndex((i) => i.name === item.name)

      if (isExist === -1) {
        const obj = {
          name: item.name,
          slug: item.slug,
          release_year: item.release_year,
          status: item.status,
        }

        if (item.relation_type)
          obj[item.relation_type] = item.company_name || null

        acc.push(obj)
      } else if (item.relation_type) {
        acc[isExist][item.relation_type] = item.company_name || null
      }
      return acc
    }, [])

    return h
      .response(
        res.map((r) => {
          if (type.match(/machine|obj/) && !r.manufacturer) {
            return {
              ...r,
              manufacturer: null,
            }
          }
          return r
        })
      )
      .type('json')
  } catch (error) {
    console.log('GET ITEMS :', error)
    return h
      .response({ error: 'Internal server error', details: error })
      .code(500)
  }
}
