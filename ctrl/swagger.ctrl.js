const { routeDefs } = require('../utils/auth')

module.exports = [
  {
    path: '/api-docs',
    method: 'GET',
    handler(_req, h) {
      let html = `
                <html>
                <head>
                    <title>API Routes Documentation</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; }
                        h1 { color: #333; }
                        h2 { color: #555; }
                        .bold { font-weight: bold; }
                        .method { color: #4088cf; display: flex; align-items: center; gap:.5rem; padding-top: 1rem; }
                        .verb { background-color: #4088cf; padding: 5px; border-radius: 5px; color: white }
                        .roles { font-style: italic; color: #e84855; padding-left: 1rem; }
                        .route { border: 1px solid #ddd; margin: 1.5rem 0; }
                    </style>
                </head>
                <body>
                    <h1>API Documentation</h1>
                    <p>Voici les routes disponibles dans cette API, avec leurs descriptions et les rôles requis :</p>
            `

      // Parcourir les définitions de routes et générer du HTML
      Object.keys(routeDefs).forEach((key) => {
        const route = routeDefs[key]
        html += "<hr class='route'></hr>"
        html += `<h2>${route.path}</h2>`

        Object.keys(route).forEach((method) => {
          if (method !== 'path') {
            const methodInfo = route[method]
            html += `<div class="method"><div class="verb">${method.toUpperCase()}</div> ${
              methodInfo.description
            }</div>`
            html += `<p class="roles">Rôles requis: ${methodInfo.roles.join(
              ', '
            )}</p>`
          }
        })
      })

      html += `
                </body>
                </html>
            `

      return h.response(html).type('text/html')
    },
  },
]
