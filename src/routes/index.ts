import { CategoryTable } from './../dbs/schema'
import express, { Request, Response, Router } from 'express'
const router = express.Router()
import userRoute from './v1/userRoute'
import productRoute from './v1/productRoute'
import providerRoute from './v1/providerRoute'
import categoryRoute from './v1/categoryRoute'
router.use('/v1/users', userRoute)
router.use('/v1/providers', providerRoute)
router.use('/v1/categories', categoryRoute)
router.use('/v1/products', productRoute)
router.get('/healthcheck', (req: Request, res: Response) => res.sendStatus(200))
export const API_v1 = router
