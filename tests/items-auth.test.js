const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Hapi = require('@hapi/hapi')
const { EncryptJWT } = require('jose')
const { getAuthor } = require('../utils/get-author')

test('la liste des cartels renvoie 401 pour une session invalide et 200 pour un membre', async (t) => {
  const previousKey = process.env.API_KEY
  process.env.API_KEY = 'ab'.repeat(32)
  t.mock.method(console, 'error', () => {})
  const server = Hapi.server()
  let handlerCalls = 0
  const routes = [{
    method: 'GET', path: '/items', options: { notes: ['member'] },
    handler: () => { handlerCalls++; return { total: 0, items: [] } },
  }, {
    method: 'GET', path: '/loot', options: { notes: ['loot'] },
    handler: () => { handlerCalls++; return { ok: true } },
  }]
  server.route(routes)
  // Tester le hook réellement utilisé sans démarrer l'écoute réseau ou les générateurs d'images.
  const source = fs.readFileSync(path.join(__dirname, '../index.js'), 'utf8')
  const hook = source.slice(source.indexOf("  server.ext('onPreHandler'"), source.indexOf('  await server.start()'))
  new Function('server', 'routes', 'getAuthor', 'process', hook)(server, routes, getAuthor, process)

  async function token(roles, expiration = '1h') {
    return new EncryptJWT({ roles })
      .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
      .setIssuer('cave_back').setAudience('cave_front')
      .setExpirationTime(expiration)
      .encrypt(Buffer.from(process.env.API_KEY, 'hex'))
  }

  try {
    const url = '/items?itemType=cartel&limit=500'
    const rejectedTokens = ['null', 'invalid', await token(['member'], '0s'),
      await token(['reviewer']), await token(undefined), await token('member')]
    for (const jwt of rejectedTokens) {
      const response = await server.inject({ url, headers: { authorization: `Bearer ${jwt}` } })
      assert.equal(response.statusCode, 401)
      assert.deepEqual(response.result, { msg: 'auth fail' })
    }
    assert.equal((await server.inject({ url })).statusCode, 401)
    assert.equal((await server.inject({ url: '/loot', headers: { authorization: 'Bearer invalid' } })).statusCode, 401)
    assert.equal(handlerCalls, 0)
    const response = await server.inject({ url, headers: { authorization: `Bearer ${await token(['member'])}` } })
    assert.equal(response.statusCode, 200)
    assert.equal(handlerCalls, 1)
  } finally {
    await server.stop()
    if (previousKey === undefined) delete process.env.API_KEY
    else process.env.API_KEY = previousKey
  }
})
