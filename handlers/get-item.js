const { getCompaniesByItemId } = require('../entities/company')
const { getItemBySlug, getMachineByGameId } = require('../entities/items')
const { getMediasByItemId, getMedia } = require('../entities/media')
const { getMediaUrl } = require('../utils/media-url')

async function getItem(slug, req, h) {
  const item = await getItemBySlug(slug)
  if (!item) return h.response({ error: 'Non trouvé' }).code(404)

  // ====== MEDIAS ========================

  if (item.cover_url) {
    item.cover_url = getMediaUrl(item.cover_url, req)
  }

  try {
    item.medias = (await getMediasByItemId(item.id)) || []
  } catch (error) {
    console.log('ITEM MEDIAS GET BY ID :', error)
    return h
      .response({ error: 'Internal server error', details: error })
      .code(500)
  }

  // ====== COMPANY ========================
  try {
    const companies = await getCompaniesByItemId(item.id)
    companies.forEach((c) => {
      c.logo_url = getMediaUrl(c.logo_id, req)
      item[c.relation_type] = c
    })
  } catch (error) {
    console.log('ITEM COMPANY GET BY ID :', error)
    return h
      .response({ error: 'Internal server error', details: error })
      .code(500)
  }

  // ====== MACHINE ========================*
  if (item.type === 'game') {
    try {
      const machine = await getMachineByGameId(item.id)
      if (machine) {
        const cover = await getMedia(machine.cover_id)

        if (cover) machine.cover_url = getMediaUrl(cover.url, req)
        item.machine = machine
        item.ref_id = machine.item_ref_id
      } else {
        item.machine = null
        item.ref_id = item.id
      }
    } catch (error) {
      console.log('ITEM MACHINE GET BY ID :', error)
      return h
        .response({ error: 'Internal server error', details: error })
        .code(500)
    }
  }

  // ====== EXPO ========================

  if (item.type === 'expo') {
    item.cartelModel = 'default'
  }

  if (!item.description) item.description = ''

  if (!item.release_year) item.release_year = ''

  return item
}

module.exports = { getItem }
