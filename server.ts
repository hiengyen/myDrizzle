import { config } from 'dotenv'
config({ path: '.env' })
import http from 'http'
import logger from './src/utils/logger'
import app from './src/app'

const server = http.createServer(app)

const PORT = process.env.PORT || 8000

server.listen(PORT, () => {
  logger.info(`App running on port ${PORT}`)
})
