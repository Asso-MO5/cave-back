const { knex } = require('../utils/db')
const { v4: uuidv4 } = require('uuid')
const { TABLES } = require('../utils/constants')

const MACHINE = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  release_year: 'release_year',
  description: 'description',
  additionnal_information: 'additionnal_information',
  cover_image: 'cover_image',
  manufacturers_id: 'manufacturers_id',
  author_id: 'author_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
}

const MACHINE_HISTORY = {
  ...MACHINE,
  machine_id: 'machine_id',
  medias: 'medias',
  version: 'version',
  modified_at: 'modified_at',
}

const MACHINE_MEDIA = {
  id: 'id',
  media_id: 'media_id',
  machine_id: 'machine_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
  author_id: 'author_id',
}

module.exports = {
  MACHINE,
  MACHINE_HISTORY,
  MACHINE_MEDIA,
  async createMachine(machine) {
    try {
      const id = uuidv4()
      await knex(TABLES.machines).insert({
        id,
        name: machine.name,
        author_id: machine.author_id,
        release_year: machine.release_year,
        description: machine.description,
        additionnal_information: machine.additionnal_information,
        cover_image: machine.cover_image,
        manufacturers_id: machine.manufacturers_id,
      })
      return id
    } catch (error) {
      console.log('MEDIA CREATE :', error)
    }
  },
}
