function getMediaUrl(url, req) {
  if (!url) return null

  return url.includes('http')
    ? url
    : req.server.info.protocol + '://' + req.info.host + url
}

module.exports = { getMediaUrl }
