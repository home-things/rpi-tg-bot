const express = require('express')

const app = express()

app.post('/signal/:name', (req, res) => {
  res.send('Hello World!')
})

const port = 7788 // TODO: use config
app.listen(port, () => console.error(`Example app listening on port ${ port }!`))
