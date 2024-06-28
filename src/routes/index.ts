import express, { Request, Response } from 'express'
const router = express.Router()
import userRoute from './v1/userRoute'
import providerRoute from './v1/providerRoute'
import categoryRoute from './v1/categoryRoute'
import attributeRoute from './v1/attributeRoute'

router.use('/v1/users', userRoute)
router.use('/v1/providers', providerRoute)
router.use('/v1/categories', categoryRoute)
router.use('/v1/attributes', attributeRoute)
router.get('/healthcheck', (req: Request, res: Response) => res.sendStatus(200))
export const API_v1 = router
