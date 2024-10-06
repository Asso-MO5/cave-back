function getTextFromBlock({
  blocks,
  ctx,
  y = 50,
  x = 50,
  fontSize = 12,
  maxX = 600,
  fontFamily = 'Arial',
  lineHeight: _lineHeight,
  maxChars = Infinity,
}) {
  // Position de base
  let currentY = y
  let currentX = x
  let currentCharsNum = 0

  const lineHeight = _lineHeight || fontSize * 1.5
  if (!blocks || !Array.isArray(blocks)) return

  for (const block of blocks) {
    if (!block.content) return

    for (const content of block.content) {
      const { text, styles } = content
      let fontStyle = `${fontSize || 12}px ${fontFamily}`

      if (styles?.bold) fontStyle = `bold ${fontSize || 12}px ${fontFamily}`
      if (styles?.italic) fontStyle = `italic ${fontSize || 12}px ${fontFamily}`
      ctx.font = fontStyle

      // Diviser le texte en phrases
      const sentences = text.split(/(?<=\.)\s+/) // Utiliser une expression régulière pour diviser correctement

      for (const sentence of sentences) {
        // Si la phrase dépasse la limite maxChars, arrêter l'affichage
        if (currentCharsNum + sentence.length > maxChars) continue
        currentCharsNum += sentence.length

        // Diviser la phrase en mots
        const words = sentence ? sentence.split(' ') : ['']

        words.forEach((word) => {
          const wordWithSpace = word + ' ' // Ajouter un espace après chaque mot
          const wordWidth = ctx.measureText(wordWithSpace).width

          // Si le mot dépasse la largeur max, passer à la ligne suivante
          if (currentX + wordWidth > maxX) {
            currentY += lineHeight
            currentX = x // Revenir au début de la ligne
          }

          // Dessiner le mot
          ctx.fillText(wordWithSpace, currentX, currentY)

          // Si le mot est souligné
          if (styles?.underline) {
            ctx.beginPath()
            ctx.moveTo(currentX, currentY + 2)
            ctx.lineTo(currentX + wordWidth, currentY + 2)
            ctx.stroke()
          }

          // Incrémenter la position X pour le mot suivant
          currentX += wordWidth
        })
      }
    }

    // Après chaque bloc (paragraphe), revenir à la ligne
    currentY += lineHeight
    currentX = x // Réinitialiser X pour le début de la ligne
  }

  return {
    x: currentX,
    y: currentY,
  }
}

module.exports = { getTextFromBlock }
