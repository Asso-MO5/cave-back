const path = require('path')
const { getGiftsPacksByGiftPackId } = require('../../entities/gifts')
const { readFileSync, existsSync, mkdirSync } = require('fs')
const ejs = require('ejs')
const jose = require('jose')
const QRCode = require('qrcode')
const { loadImage, createCanvas } = require('@napi-rs/canvas')
const pdf = require('pdf-node')
const AdmZip = require('adm-zip')
const { mail } = require('../../utils/mail')
const { FROM } = require('../../utils/constants')
const { createRandomName } = require('../../utils/createRandomName')

async function getGift_packIdDistribeType(req, h) {
  const { id, type } = req.params
  const zip = new AdmZip()
  try {
    const { gifts, giftPack } = await getGiftsPacksByGiftPackId(id)

    const template = readFileSync(
      path.join(process.cwd(), 'templates', 'gsTicketWin.ejs'),
      'utf8'
    )

    const giftFolderPath = path.join(process.cwd(), 'gen_files', 'gifts')
    const qrFolder = path.join(process.cwd(), 'gen_files', 'qr')

    const existGiftsFolder = existsSync(giftFolderPath)
    if (!existGiftsFolder) mkdirSync(giftFolderPath)

    const existQrFolder = existsSync(qrFolder)

    if (!existQrFolder) mkdirSync(qrFolder)

    const canvas = createCanvas(200, 200)
    const ctx = canvas.getContext('2d')

    const secret = Buffer.from(process.env.API_KEY, 'hex')
    for (const gift of gifts) {
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

      const qrFilePath = path.join(qrFolder, `${gift.id}.svg`)

      await QRCode.toFile(qrFilePath, url, {
        color: {
          dark: '#000',
          light: '#0000',
        },
        width: 200,
        type: 'svg',
      })

      const qr = await loadImage(`gen_files/qr/${gift.id}.svg`)

      ctx.drawImage(qr, 0, 0)
      const qrToBase64 = canvas.toDataURL()

      ctx.clearRect(0, 0, 200, 200)

      const page = ejs.render(template, {
        url,
        img: qrToBase64,
      })

      const options = {
        format: 'A4',
        orientation: 'portrait',

        border: '0mm',
        header: {
          height: '0mm',
          contents: '',
        },
        footer: {
          height: '0mm',
          contents: {
            first: 'Cover page',
            2: 'Second page', // Any page number is working. 1-based index
            default: '', // fallback value
            last: 'Last Page',
          },
        },
      }
      const docPath = path.join(giftFolderPath, `${gift.id}.pdf`)

      const document = {
        html: page,
        data: {},
        path: path.join(giftFolderPath, `${gift.id}.pdf`),
        type: 'pdf',
      }

      try {
        await pdf(document, options)
      } catch (error) {
        console.error(error)
      }

      const fileData = readFileSync(docPath)
      if (!fileData) continue

      zip.addFile(path.basename(docPath), fileData)

      //TODO en fonction du type de distribution, envoyer un email ou télécharger le fichier
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
      //TODO envoyer un email

      const zipSize = zipData.length / 1024 / 1024

      const config = {
        to: giftPack.email,
        subject: 'Vos cadeaux',
        text: 'Vos cadeaux à dsitribuer',
        // html: 'Vos cadeaux',
        from: FROM,
        attachments: [
          {
            filename: 'gifts.zip',
            content: zipData,
            contentType: 'application/zip',
          },
        ],
      }

      if (zipSize < 10) {
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

      const email = await mail.sendMail(config)
      console.log(email)
    }
    return h.response(gifts).code(200)
  } catch (e) {
    console.error(e)
    return h.response({ message: 'error' }).code(500)
  }
}

module.exports = { getGift_packIdDistribeType }
