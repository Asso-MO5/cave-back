const Canvas = require('@napi-rs/canvas')
const { Readable } = require('stream')
const { v4: uuidv4 } = require('uuid')

async function getMediaFromUrl(url) {
  const isImage = url.match(/.(jpg|jpeg|png|gif|svg|webp)$/i)
  const getIsYoutube = (url) => {
    const regex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&?]+)/
    const match = url.match(regex)
    return match ? match[1] : null
  }
  const isYoutube = getIsYoutube(url)

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

  if (isYoutube) {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${url}&format=json`
    )
    const meta = await res.json()
    const getParams = new URLSearchParams(url.split('?')[1])
    const videoId =
      getParams.get('v') || getParams.get('s') || isYoutube || uuidv4()

    return {
      id: videoId,
      name: meta.title,
      size: 0,
      type: 'youtube-video',
      url,
      cover_url: meta.thumbnail_url,
      alt: meta.title,
      description: meta.author_name,
    }
  }
}

module.exports = { getMediaFromUrl }
