/* eslint-disable no-console */

const fs = require('fs')
const http = require('axios')
const https = require('https')

const handleError = err => {
  console.error(err)
  process.exit(1)
}

fs.readFile('public/config.json', (err, data) => {
  if (err) handleError(err)
  const config = JSON.parse(data)

  fs.readdir('test/fixtures', (err, files) => {
    if (err) handleError(err)
    files.forEach(file => {
      const match = file.match(/(ctpp|tpp|tpuu|tp|mpp|mpuu|mp|substance)-(\d+)/)
      if (match) {
        const type = match[1],
          sctid = match[2]
        // Configure a custom agent to ignore self-signed certificates.
        const agent = new https.Agent({
          rejectUnauthorized: false,
        })
        http
          .get(
            config.fhirServer +
              `/${type === 'substance' ? 'Substance' : 'Medication'}/${sctid}`,
            { httpsAgent: agent },
          )
          .then(response => {
            const path = `test/fixtures/${file}`
            const newContent = JSON.stringify(response.data, null, 2)
            fs.writeFile(path, newContent, err => {
              if (err) handleError(err)
              console.log(`Updated: ${path}`)
            })
          })
          .catch(error => handleError(error))
      }
    })
  })
})
