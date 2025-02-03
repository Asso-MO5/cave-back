const path = require('path')
const { getGiftsPacksByGiftPackId } = require('../../entities/gifts')
const { readFileSync, existsSync, mkdirSync } = require('fs')
const jose = require('jose')
const QRCode = require('qrcode')
const { loadImage, createCanvas } = require('@napi-rs/canvas')
const AdmZip = require('adm-zip')
const { mail } = require('../../utils/mail')
const { FROM } = require('../../utils/constants')
const { createRandomName } = require('../../utils/createRandomName')
const pdf = require('html-pdf')
const Handlebars = require('handlebars')

async function getGift_packIdDistribeType(req, h) {
  const { id, type } = req.params
  const zip = new AdmZip()
  try {
    const { gifts, giftPack } = await getGiftsPacksByGiftPackId(id)

    const giftFolderPath = path.join(process.cwd(), 'gen_files', 'gifts')
    const qrFolder = path.join(process.cwd(), 'gen_files', 'qr')

    const existGiftsFolder = existsSync(giftFolderPath)
    if (!existGiftsFolder) mkdirSync(giftFolderPath)

    const existQrFolder = existsSync(qrFolder)

    if (!existQrFolder) mkdirSync(qrFolder)

    const canvas = createCanvas(400, 400)
    const ctx = canvas.getContext('2d')
    const tipeeeCanvas = createCanvas(800, 302)
    const tipeeeCtx = tipeeeCanvas.getContext('2d')
    const tipeee = await loadImage(`data/logos/tipeee.png`)
    tipeeeCtx.drawImage(tipeee, 0, 0)
    const tipeeeToBase64 = tipeeeCanvas.toDataURL()

    const canvasForMo5Logo = createCanvas(1500, 378)
    const ctxForMo5Logo = canvasForMo5Logo.getContext('2d')
    const mo5Logo = await loadImage(`data/logos/mo5_long.png`)
    ctxForMo5Logo.drawImage(mo5Logo, 0, 0)
    const mo5LogoToBase64 = canvasForMo5Logo.toDataURL()

    const secret = Buffer.from(process.env.API_KEY, 'hex')

    const poster = await loadImage(`data/img/gsv_poster.png`)

    const logos = [
      {
        name: 'discord',
        url: 'https://discord.com/invite/phG9zNk',
      },
      {
        name: 'facebook',
        url: 'https://www.facebook.com/AssoMO5/',
      },
      {
        name: 'x',
        url: 'https://x.com/assomo5',
      },
      {
        name: 'youtube',
        url: 'https://www.youtube.com/@AssoMO5',
      },
      {
        name: 'twitch',
        url: 'https://www.twitch.tv/mo5_com',
      },
      {
        name: 'insta',
        url: 'https://www.instagram.com/assomo5',
      },
      {
        name: 'tiktok',
        url: 'https://www.tiktok.com/@mo5asso',
      },
    ]

    const logosBase64 = []

    for (const logo of logos) {
      const logoImg = await loadImage(`data/logos/${logo.name}.png`)
      const canvasLogo = createCanvas(120, 120)
      const ctxLogo = canvasLogo.getContext('2d')
      ctxLogo.drawImage(logoImg, 0, 0)
      logosBase64.push({
        ...logo,
        img: canvasLogo.toDataURL(),
      })
    }

    const canvasForPoster = createCanvas(958, 1437)
    const ctxPoster = canvasForPoster.getContext('2d')

    ctxPoster.drawImage(poster, 0, 0)
    const posterToBase64 = canvasForPoster.toDataURL()

    let firstPdf = undefined
    const allPdfs = []
    for (const [index, gift] of gifts.entries()) {
      const token = await new jose.EncryptJWT({
        id: gift.id,
        iss: 'cave_back',
        aud: 'cave_front',
      })
        .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
        .setIssuedAt()
        .setIssuer('cave_front')
        .setAudience('cave_back')
        .setExpirationTime('720h')
        .encrypt(secret)

      const url = `${process.env.FRONT_URL}/gifts/${token}`

      const qrFilePath = path.join(qrFolder, `${gift.id}.png`)

      await QRCode.toFile(qrFilePath, url, {
        color: {
          dark: '#000',

          light: '#0000',
        },
        margin: 0,
        width: 200,
        type: 'png',
      })

      const qr = await loadImage(`gen_files/qr/${gift.id}.png`)
      ctx.clearRect(0, 0, 200, 200)
      ctx.drawImage(qr, 0, 0)
      const qrToBase64 = canvas.toDataURL()

      const docPath = path.join(giftFolderPath, `${gift.id}.pdf`)

      const htmlContent = readFileSync(
        path.join(process.cwd(), 'templates', 'gsTicketWin.hbs'),
        'utf8'
      )

      try {
        const html = Handlebars.compile(htmlContent)({
          url,
          qrCode: qrToBase64,
          img: qrToBase64,
          poster: posterToBase64,
          logos: logosBase64,
          tipeee: tipeeeToBase64,
          mo5Logo: mo5LogoToBase64,
          margin: process.env.ISDEV === 'true' ? '0cm' : '.5cm',
          noMo5: giftPack.retailer.toLowerCase() !== 'mo5' ? 'noMo5' : '',
          title:
            giftPack.retailer.toLowerCase() === 'mo5' || !giftPack.retailer
              ? `L'association MO5 a le plaisir de vous offrir cette entrée pour le musée du jeu vidéo "Game Story" à Versailles`
              : `L'association MO5 et ${giftPack.retailer} ont le plaisir de vous offrir cette entrée pour le musée du jeu vidéo "Game Story" à Versailles`,
        })

        await new Promise((resolve) => {
          pdf
            .create(html, {
              format: process.env.ISDEV === 'true' ? 'A4' : 'A3',
              // width: '21cm',
              //height: '297mm',
              scale: 0.5,
              preferCSSPageSize: true,
            })
            .toFile(path.join(giftFolderPath, `${gift.id}.pdf`), (err, res) => {
              if (err) handleError('error in creating file', err)
              resolve(res)
            })
        })
      } catch (error) {
        console.error(error)
      }

      const fileData = readFileSync(docPath)
      firstPdf = fileData
      if (!fileData) continue

      if (type === 'email')
        allPdfs.push({
          content: fileData,
          name: `pass-${index}.pdf`,
          contentType: 'application/pdf',
        })
      if (type === 'download') zip.addFile(path.basename(docPath), fileData)
    }

    const zipData = zip.toBuffer()

    if (type === 'download') {
      return h
        .response(zipData)
        .header('Content-Type', 'application/zip')
        .header('Content-Disposition', 'attachment; filename=gifts.zip')
        .code(200)
    }

    if (type === 'email') {
      const zipSize = zipData.length / 1024 / 1024
      const config = {
        to: giftPack.email,
        subject: 'Association MO5 pass "Game Story" Versailles',
        text: 'Pass à distribuer',
        // html: 'Vos cadeaux',
        from: `💾🖱️🎮 Association MO5 | Pass Game Story Versailles <${process.env.MAIL_ADDRESS}>`,
        attachments: allPdfs,
      }

      if (zipSize > 10) {
        const folderName = createRandomName()
        const uploadFolder = path.join(process.cwd(), 'uploads', folderName)
        const existUploadFolder = existsSync(uploadFolder)
        if (!existUploadFolder) mkdirSync(uploadFolder)

        const fileName = createRandomName()
        const uploadPath = path.join(uploadFolder, `${fileName}.zip`)

        zip.writeZip(uploadPath)

        const dlPath = `${process.env.FRONT_URL}/uploads/${folderName}/${fileName}.zip`
        config.text =
          'Vos cadeaux sont trop lourds pour être envoyés par email. Vous pouvez les télécharger ici : ' +
          dlPath
        // config.html = 'Vos cadeaux sont trop lourds pour être envoyés par email. Vous pouvez les télécharger ici : '
        config.attachments = []
      }

      await mail.sendMail(config)
    }

    // retourne le PDF en static, le premier fichier du zip
    return h
      .response(firstPdf)
      .header('Content-Type', 'application/pdf')
      .code(200)
  } catch (e) {
    console.error(e)
    return h.response({ message: 'error' }).code(500)
  }
}

module.exports = { getGift_packIdDistribeType }
