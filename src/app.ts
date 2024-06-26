import express from 'express'
import 'express-async-errors'
import morgan from 'morgan'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import cors from 'cors'

import { API_v1 } from './routes'
import { corsOptions } from './config/corsOption'
import { errorHandler } from './middlewares/errorHandler'

const app = express()

//init middlewares
app.use(morgan('dev'))
app.use(helmet())
app.use(compression())
app.use(cors(corsOptions))
app.use(cookieParser())
app.use(express.json())

//init routes
app.use('/', API_v1)

//handle error
app.use('*', errorHandler)

export default app
