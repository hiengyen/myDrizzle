import express, { Request, Response, Router } from 'express'
const router = express.Router()
import userRoute from './v1/userRoute'
import providerRoute from './v1/providerRoute'

router.use('/v1/users', userRoute)
router.use('/v1/providers', providerRoute)
router.get('/healthcheck', (req: Request, res: Response) => res.sendStatus(200))
export const API_v1 = router
