const { getGiftByInfo, updateGift } = require('../../entities/gifts')
const { knexGalette } = require('../../utils/db')

async function postGiftCheck(req, h) {
  const payload = JSON.parse(req.payload || '{}')

  try {
    const gift = await getGiftByInfo(payload)
    const query = knexGalette('galette_adherents')
      .where(
        'id_statut',
        '<>',
        9 // non adhérent
      )
      .andWhere('id_statut', '<>', 11) // désactivé
      .andWhere('nom_adh', 'like', payload.name)

    if (payload.email) query.andWhere('email', payload.email)
    if (payload.lastname) query.andWhere('prenom_adh', 'like', payload.lastname)
    if (payload.zipCode) query.andWhere('cp_adh', payload.zipCode)

    const member = await query.first()

    console.log(member)

    if (!gift && !member) {
      return h
        .response({
          status: 'refused',
          message: 'Les informations ne correspondent pas à un pass MO5',
        })
        .code(200)
    }

    if (member) {
      return h
        .response({
          status: 'validated',
          message: 'Les informations correspondent à un adhérent MO5',
          updated_at: new Date(),
          name: member.nom_adh,
          lastname: member.prenom_adh,
          zipCode: member.cp_adh,
          birthdate: member.ddn_adh,
          email: member.email_adh,
          isMember: true,
        })
        .code(200)
    }

    if (gift.status === 'distributed') {
      return h.response({
        message: 'Le pass a déjà été distribué',
        ...gift,
        status: 'already_distributed',
      })
    }

    const changes = {
      status: 'distributed',
      updated_at: new Date(),
    }

    await updateGift(gift.id, changes)

    return h
      .response({
        message: 'Entrée autorisée',
        ...gift,
        ...changes,
      })
      .code(200)
  } catch (e) {
    console.error(e)
    return h.response().code(500)
  }
}

module.exports = { postGiftCheck }
