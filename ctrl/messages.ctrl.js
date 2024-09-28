const { ROLES } = require('../utils/constants')
const { headers } = require('../models/header.model')
const { createMessage, getMessages } = require('../entities/messages')

module.exports = [
  {
    method: 'GET',
    path: '/messages/{room_id}',
    options: {
      description: "Récupère les messages d'une room",
      tags: ['api', 'messages'],
      notes: [ROLES.member],
      validate: {
        headers,
      },
    },
    async handler(req, h) {
      const messages = await getMessages(req.params.room_id)
      return h.response(messages).code(200)
    },
  },
  {
    method: 'POST',
    path: '/messages/{room_id}',
    options: {
      description: 'Permet de créer un message',
      tags: ['api', 'messages'],
      notes: [ROLES.member],
      validate: {
        headers,
      },
    },
    async handler(req, h) {
      const { room_id } = req.params

      const payload = JSON.parse(req.payload)
      const msg = await createMessage({
        room_id,
        author_id: req.app.user.id,
        content: payload.content,
        author_avatar: payload.user.image,
        author_name: payload.user.name,
      })

      req.server.publish('/room/' + room_id, {
        ...msg,
        created_at: new Date(),
      })

      return h.response({ msg: 'publish' }).code(201)
    },
  },
]
