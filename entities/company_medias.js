const { TABLES } = require('../utils/constants')
const { knex } = require('../utils/db')
const fs = require('fs')

const path = require('path')
const { v4: uuidv4 } = require('uuid')

const COMPANY_MEDIAS = {
  id: 'id',
  company_id: 'company_id',
  media_id: 'media_id',
  relation_type: 'relation_type',
  created_at: 'created_at',
  updated_at: 'updated_at',
  author_id: 'author_id',
}

module.exports = {
  COMPANY_MEDIAS,
  async createCompanyMedia(companyMedia) {
    const companyMediaExists = await knex(TABLES.company_medias)
      .where(COMPANY_MEDIAS.company_id, companyMedia.company_id)
      .andWhere(COMPANY_MEDIAS.media_id, companyMedia.media_id)
      .first()

    if (companyMediaExists) return companyMediaExists
    const newCompanyMedia = {
      id: uuidv4(),
      company_id: companyMedia.company_id,
      media_id: companyMedia.media_id,
      relation_type: companyMedia.relation_type,
      author_id: companyMedia.author_id,
      created_at: new Date(),
      updated_at: new Date(),
    }
    await knex(TABLES.company_medias).insert(newCompanyMedia)
    return newCompanyMedia
  },
  async createOrUpdateCompanyLogo(companyId, mediaId, authorId) {
    try {
      const companyMediaExists = await knex(TABLES.company_medias)
        .where(COMPANY_MEDIAS.company_id, companyId)
        .andWhere(COMPANY_MEDIAS.relation_type, 'logo')
        .first()

      if (companyMediaExists) {
        await knex(TABLES.company_medias)
          .where(COMPANY_MEDIAS.company_id, companyId)
          .andWhere(COMPANY_MEDIAS.relation_type, 'logo')
          .update({ media_id: mediaId, updated_at: new Date() })
        return companyMediaExists
      }

      const newCompanyMedia = {
        id: uuidv4(),
        company_id: companyId,
        media_id: mediaId,
        relation_type: 'logo',
        author_id: authorId,
        created_at: new Date(),
        updated_at: new Date(),
      }

      await knex(TABLES.company_medias).insert(newCompanyMedia)
      return newCompanyMedia
    } catch (error) {
      console.log('COMPANY MEDIA CREATE :', error)
    }
  },
}
