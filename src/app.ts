import express, { ErrorRequestHandler } from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import cors from 'cors'

import router from './routes'

const app = express()

//init middlewares
app.use(morgan('dev'))
app.use(helmet())
app.use(compression())
app.use(cors({ credentials: true }))
app.use(cookieParser())
app.use(express.json())

//init routes
app.use('/', router)

//handle error
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {}

app.use(errorHandler)

export default app
