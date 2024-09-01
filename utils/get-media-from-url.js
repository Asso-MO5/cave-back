const Canvas = require('@napi-rs/canvas')
const { Readable } = require('stream')

async function getMediaFromUrl(url) {
  const isImage = url.match(/.(jpg|jpeg|png|gif|svg|webp)$/i)

  if (isImage) {
    try {
      const background = await Canvas.loadImage(url)
      const canvas = Canvas.createCanvas(background.width, background.height)
      const context = canvas.getContext('2d')
      context.drawImage(background, 0, 0)

      const buffer = canvas.toBuffer('image/webp')
      const stream = new Readable()
      stream.push(buffer)
      stream.push(null)

      const file = {
        hapi: {
          filename: url.split('/').pop(),
          headers: {
            'content-type': 'image/webp',
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

      return file
    } catch (error) {
      console.log('error :', error)
      throw new Error(error)
    }
  }
}

module.exports = { getMediaFromUrl }
