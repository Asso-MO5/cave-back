const Joi = require('joi')
const { createMedia, getMediasByItemId } = require('../entities/media')
const {
  createItems,
  getItemBySlug,
  getItemById,
  getItemByNameAndType,
  updateItem,
  getMachinesByRefId,
  getMachineByGameId,
} = require('../entities/items')
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
const { ROLES } = require('../utils/constants')
const itemsHandler = require('../handlers/items.handler')
const { ITEM_MODEL } = require('../models/item.model')
const { stat } = require('fs')

module.exports = [
  {
    method: 'GET',
    path: '/items',
    handler: itemsHandler,
    options: {
      description: 'Récupère la liste des items (jeux, machines, listes, etc.)',
      tags: ['api', 'items', 'listes', 'machines', 'jeux'],
      notes: [ROLES.member],

      validate: {
        query: Joi.object({
          type: Joi.string().valid('game', 'machine').required(),
          limit: Joi.number().integer().min(1).max(100000).default(10),
        }),
        headers: Joi.object({
          authorization: Joi.string().required(),
        }).unknown(),
      },
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
          author_id: req.app.user.id,
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
          req.app.user.id
        )

        return h.response(refItem).code(201)
      }

      const newItem = await createItems({
        name: refItem.name,
        author_id: req.app.user.id,
        type: 'game',
      })

      await createRelation(
        ref_id,
        newItem.id,
        machine_id,
        'machine_game',
        req.app.user.id
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
      const oldItem = await getItemById(req.params.id)
      if (!oldItem) return h.response({ error: 'Non trouvé' }).code(404)

      if (data.status)
        return h
          .response({
            error: 'Vous ne pouvez pas modifier le status via cette route',
          })
          .code(400)

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
            author_id: req.app.user.id,
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
            author_id: req.app.user.id,
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
            author_id: req.app.user.id,
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
          author_id: req.app.user.id,
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
  {
    method: 'PUT',
    path: '/items/{id}/status/{status}',
    options: {
      description: "Permet de changer le status d'un item",
      tags: ['api', 'items', 'listes', 'machines', 'jeux'],
      notes: [ROLES.reviewer],
      validate: {
        headers: Joi.object({
          authorization: Joi.string().required(),
        }).unknown(),
      },
      response: {
        status: {
          201: ITEM_MODEL.required(),
        },
      },
    },
    async handler(req, h) {
      const oldItem = await getItemById(req.params.id)
      if (!oldItem) return h.response({ error: 'Non trouvé' }).code(404)

      const status = req.params.status

      // ====== COVER ==========================================================

      try {
        await createItemHistory(oldItem.id)
      } catch (error) {
        console.log('ITEM HISTORY :', error)
        return h
          .response({ error: 'Internal server error', details: error })
          .code(500)
      }

      try {
        await updateItem(oldItem.id, {
          status,
          author_id: req.app.user.id,
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
