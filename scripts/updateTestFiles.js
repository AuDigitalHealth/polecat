const fs = require('fs')
const http = require('axios')

const handleError = err => {
  console.error(err)
  process.exit(1)
}

fs.readFile('public/config.json', (err, data) => {
  if (err) handleError(err)
  const config = JSON.parse(data)

  fs.readdir('test', (err, files) => {
    if (err) handleError(err)
    files.forEach(file => {
      const match = file.match(/(ctpp|tpp|tpuu|tp|mpp|mpuu|mp|substance)-(\d+)/)
      if (match) {
        const type = match[1],
          sctid = match[2]
        http
          .get(
            config.fhirServer +
              `/${type === 'substance' ? 'Substance' : 'Medication'}/${sctid}`
          )
          .then(response => {
            const path = `test/${file}`
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
