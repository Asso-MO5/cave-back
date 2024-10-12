const translatedType = [
  { type: 'Objet', translation: 'obj' },
  { type: 'Jeu', translation: 'game' },
  { type: 'Machine', translation: 'machine' },
  { type: 'Exposition', translation: 'expo' },
  { type: 'Logiciel', translation: 'soft' },
  { type: 'Accessoire', translation: 'accessory' },
  { type: 'publisher', translation: 'Éditeur' },
  { type: 'developer', translation: 'Développeur' },
]

function translateType(type) {
  const cleanType = type
    .toLowerCase()
    .trim()
    .replace(/ /g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  const translated = translatedType.find((t) => t.type === cleanType)

  return translated ? translated.translation : type
}

function translateTypeFr(type) {
  const cleanType = type
    .toLowerCase()
    .trim()
    .replace(/ /g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  const translated = translatedType.find((t) =>
    t.type.toLowerCase().includes(cleanType)
  )

  return translated ? translated.translation : type
}

module.exports = {
  translateType,
  translateTypeFr,
}
