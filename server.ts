import http from 'http'
import logger from './src/utils/logger.js'
import app from './src/app.js'

const server = http.createServer(app)

import 'dotenv/config'
const PORT = process.env.PORT || 8000

server.listen(PORT, () => {
  logger.info(`App running on port ${PORT}`)
})
