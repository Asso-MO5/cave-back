const Joi = require('joi')
const { createMedia, getMediasByItemId } = require('../entities/media')
const {
  createItems,
  getItemBySlug,
  getItemById,
  getItems,
  getItemByNameAndType,
  updateItem,
  getMachinesByRefId,
  getMachineByGameId,
} = require('../entities/items')
const { getAuthor } = require('../utils/get-author')
const { ROLES } = require('../utils/constants')
const { getMediaUrl } = require('../utils/media-url')
const { getCompaniesByItemId } = require('../entities/company')
const { createItemHistory } = require('../entities/item-history')
const { replaceCompanyForItem } = require('../entities/item-company')
const Canvas = require('@napi-rs/canvas')
const { Readable } = require('stream')
const {
  createRelation,
  getRelationbyLeftIdAndRightId,
  getRelationByReIdAndType,
} = require('../entities/item-items')

module.exports = [
  {
    method: 'GET',
    path: '/items',
    async handler(req, h) {
      await getAuthor(req, h, [ROLES.member])

      try {
        const items = await getItems(req.query.type)

        const res = items.reduce((acc, item) => {
          const isExist = acc.findIndex((i) => i.name === item.name)
          if (isExist === -1) {
            acc.push({
              name: item.name,
              slug: item.slug,
              release_year: item.release_year,
              [item.relation_type]: item.company_name,
            })
          } else {
            acc[isExist][item.relation_type] = item.company_name
          }
          return acc
        }, [])

        return h.response(res).type('json')
      } catch (error) {
        console.log('GET ITEMS :', error)
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }
    },
  },
  {
    method: 'GET',
    path: '/machines/{id}',
    async handler(req, h) {
      const query = await getMachinesByRefId(req.query.id)
      return h.response(query).type('json')
    },
  },
  {
    method: 'GET',
    path: '/items/{slug}',
    async handler(req, h) {
      await getAuthor(req, h, [ROLES.member])

      try {
        const item = await getItemBySlug(req.params.slug)
        if (!item) return h.response({ error: 'Non trouvé' }).code(404)

        // ====== MEDIAS ========================

        if (item.cover_url) {
          item.cover_url = getMediaUrl(item.cover_url, req)
        }

        try {
          item.medias = await getMediasByItemId(item.id)
        } catch (error) {
          console.log('ITEM MEDIAS GET BY ID :', error)
          return h
            .response({ error: 'Internal server error', details: error })
            .code(500)
        }

        // ====== COMPANY ========================
        try {
          const companies = await getCompaniesByItemId(item.id)
          companies.forEach((c) => {
            item[c.relation_type] = c
          })
        } catch (error) {
          console.log('ITEM COMPANY GET BY ID :', error)
          return h
            .response({ error: 'Internal server error', details: error })
            .code(500)
        }

        // ====== MACHINE ========================*
        if (item.type === 'game') {
          try {
            const machine = await getMachineByGameId(item.id)
            if (machine) {
              item.machine = machine
              item.ref_id = machine.item_ref_id
            } else {
              item.machine = {}
              item.ref_id = item.id
            }
          } catch (error) {
            console.log('ITEM MACHINE GET BY ID :', error)
            return h
              .response({ error: 'Internal server error', details: error })
              .code(500)
          }
        }

        return h.response(item).type('json')
      } catch (error) {
        console.log('MACHINE GET BY ID :', error)
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }
    },
  },
  {
    method: 'POST',
    path: '/items',
    options: {
      payload: {
        parse: true,
        output: 'stream',
        multipart: true,
        maxBytes: 800 * 1024 * 1024, //800 mb
      },
    },
    async handler(req, h) {
      const author = await getAuthor(req, h, [ROLES.member])

      const schema = Joi.object({
        name: Joi.string().required(),
      })

      const { error, value: machine } = schema.validate(req.payload)

      if (error) {
        const details = error.details.map((i) => i.message).join(',')
        return h.response({ error: details }).code(400)
      }

      const ifMachineExist = await getItemByNameAndType(
        machine.name,
        req.query.type
      )

      if (ifMachineExist)
        return h.response({ error: 'Machine déjà existante' }).code(400)

      try {
        const newItem = await createItems({
          ...machine,
          author_id: author.id,
          type: req.query.type,
        })

        return h.response(newItem).type('json').code(201)
      } catch (error) {
        console.log('MACHINE CREATE :', error)

        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }
    },
  },

  {
    method: 'PUT',
    path: '/machine/{machine_id}/game/{ref_id}',
    async handler(req, h) {
      const author = await getAuthor(req, h, [ROLES.member])
      const { machine_id, ref_id } = req.params

      const refItem = await getItemById(ref_id)

      const relation = await getRelationbyLeftIdAndRightId(ref_id, machine_id)

      if (relation) return h.response(refItem).code(200)

      const existOtherRelation = await getRelationByReIdAndType(
        ref_id,
        'machine_game'
      )

      if (!existOtherRelation?.id) {
        await createRelation(
          ref_id,
          ref_id,
          machine_id,
          'machine_game',
          author.id
        )

        return h.response(refItem).code(201)
      }

      const newItem = await createItems({
        name: refItem.name,
        author_id: author.id,
        type: 'game',
      })

      await createRelation(
        ref_id,
        newItem.id,
        machine_id,
        'machine_game',
        author.id
      )

      return h.response(await getItemById(newItem.id)).code(201)
    },
  },
  {
    method: 'PUT',
    path: '/items/{id}',
    options: {
      payload: {
        parse: true,
        output: 'stream',
        multipart: true,
        maxBytes: 800 * 1024 * 1024, //800 mb
      },
    },
    async handler(req, h) {
      const data = req.payload
      const author = await getAuthor(req, h, [ROLES.member])

      const oldItem = await getItemById(req.params.id)
      if (!oldItem) return h.response({ error: 'Non trouvé' }).code(404)

      // ====== COVER ==========================================================

      try {
        await createItemHistory(oldItem.id)
      } catch (error) {
        console.log('ITEM HISTORY :', error)
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }

      if (data.cover && data.cover?.hapi?.filename) {
        const [cover] = await createMedia([data.cover])

        oldItem.cover_id = cover.id
        try {
          await updateItem(oldItem.id, {
            cover_id: cover.id,
            author_id: author.id,
          })
        } catch (error) {
          return h
            .response({ error: 'Internal server error', details: error })
            .code(500)
        }

        oldItem.cover_url = getMediaUrl(cover.url, req)

        return h.response(oldItem).code(201)
      }

      if (data.cover_id) {
        try {
          await updateItem(oldItem.id, {
            cover_id: data.cover_id,
            author_id: author.id,
          })
        } catch (error) {
          return h
            .response({ error: 'Internal server error', details: error })
            .code(500)
        }

        return h.response(oldItem).code(201)
      }

      if (data.cover_url && data.cover_url.includes('http')) {
        const background = await Canvas.loadImage(data.cover_url)
        const canvas = Canvas.createCanvas(background.width, background.height)
        const context = canvas.getContext('2d')
        context.drawImage(background, 0, 0)

        const buffer = canvas.toBuffer('image/png')
        const stream = new Readable()
        stream.push(buffer)
        stream.push(null)

        const file = {
          hapi: {
            filename: data.cover_url.split('/').pop(),
            headers: {
              'content-type': 'image/png',
            },
          },
          _data: buffer,
          pipe: (dest) => stream.pipe(dest),
          alt: '',
          description: '',
          on: (event, cb) => {
            if (event === 'end') {
              cb()
            }
          },
        }

        const [cover] = await createMedia([file])

        oldItem.cover_id = cover.id
        try {
          await updateItem(oldItem.id, {
            cover_id: cover.id,
            author_id: author.id,
          })
        } catch (error) {
          return h
            .response({
              error: 'Internal server error',
              details: error,
            })
            .code(500)
        }

        oldItem.cover_url = getMediaUrl(cover.url, req)

        return h.response(oldItem).code(201)
      }
      // ====== COMPANIES ==========================================================
      if (data.company_id) {
        // Replace the old company
        if (data.company_old_id) {
          try {
            // create if not exist
            const newCompany = await replaceCompanyForItem(
              oldItem.id,
              data.company_id,
              data.company_old_id,
              data.company_relation_type,
              author.id
            )
            oldItem[data.company_relation_type] = newCompany
            return h.response(oldItem).code(201)
          } catch (error) {
            console.log('COMPANY REPLACE :', error)
            return h
              .response({ error: 'Internal server error', details: error })
              .code(500)
          }
        }

        return h.response(oldItem).code(201)
      }

      try {
        await updateItem(oldItem.id, {
          ...data,
          author_id: author.id,
        })
      } catch (error) {
        console.log('ITEM UPDATE :', error)
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }

      return h.response(oldItem).code(201)
    },
  },
]
