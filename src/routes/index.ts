import express, { Request, Response, Router } from 'express'
const router = express.Router()
import auth from './auth'

router.use('/auth', auth)
router.get('/healthcheck', (req: Request, res: Response) => res.sendStatus(200))
export default router
