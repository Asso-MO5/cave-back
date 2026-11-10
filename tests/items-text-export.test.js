const { test } = require('node:test')
const assert = require('node:assert/strict')
const { itemsToText } = require('../utils/items-to-text')

test('regroupe les champs et relations avant les descriptions, sans perdre zéro ou false', () => {
  const result = itemsToText([{
    name: 'Écran', var_place: 'Salle 1', var_price: 0, available: false,
    updated_at: new Date('2026-01-01T00:00:00Z'),
    medias: [{ url: 'image.png' }],
    relations: [{ relation_type: 'manufacturer', name: 'MO5' }],
    long_description_en: 'English description.',
    long_short_description: 'Présentation courte.',
    long_description_fr: 'Description française.',
  }])
  assert.match(result, /\[Métadonnées\]\nNom: Écran\nEmplacement: Salle 1\nPrix: 0\navailable: false/)
  assert.match(result, /Modification: 2026-01-01T00:00:00.000Z\nFabricant: MO5\n\[\/Métadonnées\]/)
  assert.ok(result.endsWith('Présentation courte.\n\nDescription française.\n\nEnglish description.\n'))
  assert.doesNotMatch(result, /image.png|\[object Object\]|long_description/)
})

test('convertit les blocs riches, liens et paragraphes imbriqués en texte', () => {
  const result = itemsToText([{
    name: 'Test',
    long_description_fr: JSON.stringify([
      { type: 'image', content: undefined },
      { type: 'paragraph', content: [
        { text: 'Un texte ', styles: { bold: true } },
        { type: 'link', href: 'https://example.com', content: [{ text: 'lié.' }] },
      ], children: [{ content: [{ text: 'Paragraphe enfant.' }] }] },
      { content: [{ text: 'Dernier paragraphe.' }] },
    ]),
  }])
  assert.ok(result.endsWith('Un texte lié.\n\nParagraphe enfant.\n\nDernier paragraphe.\n'))
  assert.doesNotMatch(result, /styles|href|https:/)
})

test('sépare les fiches et accepte les descriptions vides', () => {
  assert.equal(itemsToText([]), '')
  const result = itemsToText([
    { name: 'A', long_description_fr: null },
    { name: 'B', long_description_fr: [] },
  ])
  assert.equal(result, '[Métadonnées]\nNom: A\n[/Métadonnées]\n\n----------------------------------------\n\n[Métadonnées]\nNom: B\n[/Métadonnées]\n')
})

test('exporte une sélection ou toutes les fiches du type demandé une seule fois', async () => {
  // Isoler le handler de MySQL et des dépendances de génération des images.
  const entitiesPath = require.resolve('../entities/items')
  const printPath = require.resolve('../utils/print-items')
  const handlerPath = require.resolve('../handlers/items/postItemsExport')
  const cachePaths = [entitiesPath, printPath, handlerPath]
  const previous = cachePaths.map((key) => require.cache[key])
  let filters
  const loaded = []
  require.cache[entitiesPath] = { loaded: true, exports: {
    getItemsForExport: async (value) => {
      filters = value
      return [{ id: 'a' }, { id: 'a' }, { id: 'b' }]
    },
    getItemById: async (id) => { loaded.push(id); return { id, name: id } },
  } }
  require.cache[printPath] = { loaded: true, exports: {} }
  delete require.cache[handlerPath]
  try {
    const { postItemsExport } = require(handlerPath)
    const h = { response: (body) => ({
      body, headers: {},
      header(key, value) { this.headers[key] = value; return this },
      code(value) { this.statusCode = value; return this },
    }) }
    for (const selectedTotal of [false, true]) {
      loaded.length = 0
      const response = await postItemsExport({ payload: JSON.stringify({
        exportType: 'txt', type: 'cartel', ids: ['a', 'b'], selectedTotal,
      }) }, h)
      assert.deepEqual(filters, { type: 'cartel', ids: selectedTotal ? undefined : ['a', 'b'] })
      assert.deepEqual(loaded, ['a', 'b'])
      assert.equal(response.statusCode, 200)
      assert.equal(response.headers['Content-Type'], 'text/plain; charset=utf-8')
      assert.equal(response.headers['Content-Disposition'], 'attachment; filename=export.txt')
      assert.match(response.body, /Nom: a/)
      assert.match(response.body, /Nom: b/)
    }
  } finally {
    cachePaths.forEach((key, index) => {
      if (previous[index]) require.cache[key] = previous[index]
      else delete require.cache[key]
    })
  }
})
