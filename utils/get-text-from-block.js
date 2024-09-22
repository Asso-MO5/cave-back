function getTextFromBlock({
  blocks,
  ctx,
  y = 50,
  x = 50,
  fontSize = 12,
  maxX = 600,
  fontFamily = 'Arial',
}) {
  // Position de base
  let currentY = y
  let currentX = x

  if (!blocks || !Array.isArray(blocks)) return

  blocks.forEach((block) => {
    if (!block.content) return

    block?.content?.forEach((content) => {
      const { text, styles } = content
      let fontStyle = `${fontSize || 12}px ${fontFamily}`

      if (styles?.bold) fontStyle = `bold ${fontSize || 12}px ${fontFamily}`
      if (styles?.italic) fontStyle = `italic ${fontSize || 12}px ${fontFamily}`
      ctx.font = fontStyle

      // Séparer le texte en mots
      const words = text ? text?.split(' ') : ['']

      words.forEach((word) => {
        const wordWithSpace = word + ' ' // Ajoute l'espace après chaque mot
        const wordWidth = ctx.measureText(wordWithSpace).width

        // Si le mot dépasse la largeur max, on revient à la ligne
        if (currentX + wordWidth > maxX) {
          currentY += fontSize * 1.5 // Passer à la ligne suivante
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
    })

    // Après chaque bloc (paragraphe), revenir à la ligne
    currentY += fontSize * 1.5
    currentX = x // Réinitialiser X pour le début de la ligne
  })
  return {
    x: currentX,
    y: currentY,
  }
}

module.exports = { getTextFromBlock }
