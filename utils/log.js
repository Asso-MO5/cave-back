const fs = require('fs')
const path = require('path')

function log(msg) {
  const file = path.join(process.cwd(), 'log.txt')
  const date = new Date()
  const isExist = fs.existsSync(file)
  if (!isExist) {
    fs.writeFileSync(file, '')
  }
  const oldContent = fs.readFileSync(file, 'utf8') || ''
  const newContent = `${oldContent}\n${date.toISOString()} - ${msg}`
  fs.writeFileSync(file, newContent)
}

module.exports = { log }
