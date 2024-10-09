const translatedType = [
  { type: 'Objet', translation: 'obj' },
  { type: 'Jeu', translation: 'game' },
  { type: 'Machine', translation: 'machine' },
  { type: 'Exposition', translation: 'expo' },
  { type: 'Logiciel', translation: 'soft' },
  { type: 'Accessoire', translation: 'accessory' },
]

function translateType(type) {
  const cleanType = type
    .toLowerCase()
    .trim()
    .replace(/ /g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  const translated = translatedType.find((t) => t.type === cleanType)
  return translated ? translated.translation : 'obj'
}

module.exports = {
  translateType,
}
