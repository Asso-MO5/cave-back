const { TABLES } = require('../utils/constants')
const { knex } = require('../utils/db')
const fs = require('fs')

const path = require('path')
const { v4: uuidv4 } = require('uuid')

const MEDIA = {
  id: 'id',
  name: 'name',
  url: 'url',
  alt: 'alt',
  description: 'description',
  type: 'type',
  size: 'size',
  created_at: 'created_at',
  updated_at: 'updated_at',
}

module.exports = {
  async createMedia(medias) {
    const dir = path.join(__dirname, '../uploads')

    if (!fs.existsSync(dir)) fs.mkdirSync(dir)
    const date = new Date()
    const dateStr = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}`

    const dateFolder = path.join(dir, dateStr)

    if (!fs.existsSync(dateFolder)) fs.mkdirSync(dateFolder)

    const filesToSave = []
    for (const file of medias.filter((media) => !!media._data.length)) {
      const extension = path.extname(file.hapi.filename)
      const id = uuidv4()
      const uuidName = id + extension
      const destination = path.join(dir, `${dateStr}/${uuidName}`)
      const fileStream = fs.createWriteStream(destination)

      await new Promise((resolve, reject) => {
        file.pipe(fileStream)

        file.on('end', resolve)
        file.on('error', reject)
        filesToSave.push({
          id,
          name: file.hapi.filename.split('.')[0],
          size: file._data.length,
          type: file.hapi.headers['content-type'],
          url: `/uploads/${dateStr}/${uuidName}`,
          alt: file.alt || file.hapi.filename,
          description: file.description || '',
        })
      })
    }

    try {
      await knex(TABLES.medias).insert(filesToSave)
      return filesToSave.map((media) => media.id)
    } catch (error) {
      console.log('MEDIA CREATE :', error)
    }
  },
  async getMedia(mediaId) {
    try {
      return await knex(TABLES.medias).where({ id: mediaId }).first()
    } catch (error) {
      console.log('MEDIA GET :', error)
    }
  },
  async getMedia(url) {
    try {
      return await knex(TABLES.medias).where({ url }).first()
    } catch (error) {
      console.log('MEDIA GET :', error)
    }
  },
  async deleteMedia(mediaId) {
    try {
      await knex(TABLES.medias).where({ id: mediaId }).del()
    } catch (error) {
      console.log('MEDIA DELETE :', error)
    }
  },
  MEDIA,
}
