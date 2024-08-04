const machinesCtrl = require('./ctrl/machines.ctrl')

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
  ...machinesCtrl,
]

module.exports = { routes }
