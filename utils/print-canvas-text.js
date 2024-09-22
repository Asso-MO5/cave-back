/**
 *
 * @param {Object} param
 * @param {CanvasRenderingContext2D} param.ctx
 * @param {string} param.text
 * @param {number} param.x
 * @param {number} param.y
 * @param {string} param.font
 * @param {string} param.color
 * @returns {number} currentY
 */
function printCanvasText({
  ctx,
  text,
  x,
  y,
  fontSize = 12,
  fontFamily = 'Arial',
  color = 'black',
  maxX,
  lineHeight: _lineHeight,
  style,
}) {
  let currentY = y
  let currentX = x
  ctx.fillStyle = color
  const lineHeight = _lineHeight || fontSize * 1.5
  const words = text ? text?.split(' ') : ['']

  ctx.font = `${fontSize}px ${fontFamily}`
  if (style === 'bold') ctx.font = `bold ${fontSize || 12}px ${fontFamily}`
  if (style === 'italic') ctx.font = `italic ${fontSize || 12}px ${fontFamily}`

  words.forEach((word) => {
    const wordWithSpace = word + ' ' // Ajoute l'espace après chaque mot
    const wordWidth = ctx.measureText(wordWithSpace).width

    // Si le mot dépasse la largeur max, on revient à la ligne
    if (currentX + wordWidth > maxX) {
      currentY += lineHeight // Passer à la ligne suivante
      currentX = x // Revenir au début de la ligne
    }
    // Si le mot dépasse la largeur max, on revient à la ligne
    if (currentX + wordWidth > maxX) {
      currentY += lineHeight // Passer à la ligne suivante
      currentX = x // Revenir au début de la ligne
    }

    // Dessiner le mot
    ctx.fillText(wordWithSpace, currentX, currentY)

    // Incrémenter la position X pour le mot suivant
    currentX += wordWidth
  })
  return {
    x: currentX,
    y: currentY,
  }
}

module.exports = { printCanvasText }
