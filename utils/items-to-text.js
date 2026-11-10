const FIELD_LABELS = {
  id: 'Identifiant',
  name: 'Nom',
  type: 'Type',
  status: 'Statut',
  author_id: 'Auteur',
  created_at: 'Création',
  updated_at: 'Modification',
  var_place: 'Emplacement',
  var_origin: 'Provenance',
  var_price: 'Prix',
  var_release_fr: 'Date de sortie FR',
  var_release_eu: 'Date de sortie EUR',
  var_release_jap: 'Date de sortie JAP',
  var_release_us: 'Date de sortie USA',
  manufacturer: 'Fabricant',
  publisher: 'Éditeur',
  developer: 'Développeur',
  machine: 'Machine',
}

const DESCRIPTION_KEYS = [
  'long_short_description',
  'long_description_fr',
  'long_description_en',
]

function inlineToText(content) {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content.map((inline) => inline?.text || inlineToText(inline?.content)).join('')
}

function descriptionToText(value) {
  if (typeof value === 'string') {
    try {
      const blocks = JSON.parse(value)
      if (Array.isArray(blocks)) return descriptionToText(blocks)
    } catch (_) {
      // Les anciennes descriptions sont enregistrées directement en texte.
    }
    return value.trim()
  }
  if (!Array.isArray(value)) return ''

  return value
    .map((block) => {
      if (typeof block === 'string') return block
      if (!block) return ''
      const content = inlineToText(block.content)
      return [content.trim(), descriptionToText(block.children)]
        .filter(Boolean)
        .join('\n\n')
    })
    .filter(Boolean)
    .join('\n\n')
}

function itemsToText(items) {
  return items.map((item) => {
    const metadata = Object.entries(item)
      .filter(([key, value]) => !key.includes('description') && value != null &&
        (value instanceof Date || ['string', 'number', 'boolean'].includes(typeof value)))
      .map(([key, value]) => {
        const text = value instanceof Date ? value.toISOString() : String(value)
        return `${FIELD_LABELS[key] || key}: ${text.replace(/\s*\r?\n\s*/g, ' ')}`
      })

    for (const relation of item.relations || []) {
      metadata.push(`${FIELD_LABELS[relation.relation_type] || relation.relation_type}: ${relation.name}`)
    }

    const descriptionKeys = [...new Set([
      ...DESCRIPTION_KEYS,
      ...Object.keys(item).filter((key) => key.includes('description')),
    ])]
    const descriptions = descriptionKeys
      .map((key) => descriptionToText(item[key]))
      .filter(Boolean)

    return ['[Métadonnées]', ...metadata, '[/Métadonnées]', '', descriptions.join('\n\n')]
      .join('\n')
      .trimEnd()
  }).join('\n\n----------------------------------------\n\n') + (items.length ? '\n' : '')
}

module.exports = { itemsToText }
