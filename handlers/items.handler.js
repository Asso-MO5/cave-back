const { getItems } = require('../entities/items')

const TYPE = {
  '/games': 'game',
  '/machines': 'machine',
  '/objs': 'obj',
  '/expos': 'expo',
  '/expos/cartels': 'expo_cartels',
}

module.exports = async (req, h) => {
  try {
    const type = TYPE?.[req.route.path]
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
            const obj = { ...r }
            delete obj.type // remove type from obj
            return {
              ...obj,
              manufacturer: null,
            }
          }
          if (type.match(/expo/) && !r.machines) {
            return {
              name: r.name,
              slug: r.slug,
              status: r.status,
            }
          }

          if (type.match(/expo_cartels/) && !r.publisher) {
            return {
              name: r.name,
              slug: r.slug,
              status: r.status,
              type: r.type,
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
