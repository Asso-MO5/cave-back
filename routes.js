const routes = [
  {
    method: 'GET',
    path: '/',
    handler(req, h) {
      req.server.publish('/test', {
        test: 'test msg',
      })
      return 'Hello World!'
    },
  },
  ...require('./ctrl/auth.ctrl'),
  ...require('./ctrl/machines.ctrl'),
  ...require('./ctrl/companies.ctrl'),
]

module.exports = { routes }
