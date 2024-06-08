import pino from 'pino'
import dayjs from 'dayjs'

// Create a transport for pino-pretty
const transport = pino.transport({
  target: 'pino-pretty',
  options: {
    colorize: true,
  },
  //
})

// Configure the logger
const log = pino(
  {
    base: {
      pid: false,
    },
    timestamp: () => `,"time":"${dayjs().format()}"`,
  },
  transport,
)

export default log
