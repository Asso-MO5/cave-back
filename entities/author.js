const { knex } = require('../utils/db')
const { v4: uuidv4 } = require('uuid')
const { TABLES } = require('../utils/constants')

const AUTHOR = {
  id: 'id',
  provider_id: 'provider_id',
  name: 'name',
}

module.exports = {
  AUTHOR,
  async findOrCreateAuthor(author) {
    const [foundAuthor] = await knex(TABLES.authors)
      .select('*')
      .where(AUTHOR.provider_id, author.provider_id)
      .limit(1)

    if (foundAuthor) return foundAuthor

    try {
      const id = uuidv4()
      const newAuthor = {
        id,
        ...author,
        created_at: new Date(),
        updated_at: new Date(),
      }
      await knex(TABLES.authors).insert(newAuthor)
      return newAuthor
    } catch (error) {
      console.log('MEDIA CREATE :', error)
    }
  },
}
