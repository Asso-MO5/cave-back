const { v4: uuidv4 } = require('uuid')
const { knex } = require('../utils/db')
const { TABLES } = require('../utils/constants')

const MESSAGE = {
  id: 'id',
  room_id: 'room_id',
  author_id: 'author_id',
  content: 'content',
  created_at: 'created_at',
  updated_at: 'updated_at',
  deleted_at: 'deleted_at',
  author_avatar: 'author_avatar',
  author_name: 'author_name',
}

module.exports = {
  MESSAGE,
  async createMessage(message) {
    const id = uuidv4()
    try {
      await knex(TABLES.messages).insert({
        [MESSAGE.id]: id,
        ...message,
      })

      return {
        id,
        ...message,
      }
    } catch (error) {
      console.error(error)
    }
  },
  async getMessages(room_id) {
    try {
      return await knex(TABLES.messages)
        .where(MESSAGE.room_id, room_id)
        .orderBy('created_at', 'asc')
        .limit(1000)
        .select()
    } catch (error) {
      console.error(error)
    }
  },
}
