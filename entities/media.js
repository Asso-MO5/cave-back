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
      return filesToSave
    } catch (error) {
      console.log('MEDIA CREATE :', error)
    }
  },
  async createMediasBase64(medias) {
    const dir = path.join(__dirname, '../uploads')

    if (!fs.existsSync(dir)) fs.mkdirSync(dir)
    const date = new Date()
    const dateStr = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}`

    const dateFolder = path.join(dir, dateStr)

    if (!fs.existsSync(dateFolder)) fs.mkdirSync(dateFolder)

    const filesToSave = []
    for (const file of medias.filter((media) => !!media.base64.length)) {
      const extension = '.webp'
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
      return filesToSave
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
  async getMediasByItemId(itemId) {
    try {
      return await knex(TABLES.medias)
        .join(
          TABLES.item_medias,
          TABLES.medias + '.' + MEDIA.id,
          '=',
          TABLES.item_medias + '.media_id'
        )
        .where({ [TABLES.item_medias + '.item_id']: itemId })
        .select(
          TABLES.medias + '.' + MEDIA.id,
          TABLES.medias + '.' + MEDIA.url,
          TABLES.medias + '.' + MEDIA.alt,
          TABLES.medias + '.' + MEDIA.type
        )
    } catch (error) {
      console.log('MEDIA GET :', error)
    }
  },
  async getMedias(search) {
    try {
      const baseQuery = knex(TABLES.medias)
      if (search) baseQuery.where(MEDIA.name, 'like', `%${search}%`)
      return await baseQuery.select('id', 'url', 'name')
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
