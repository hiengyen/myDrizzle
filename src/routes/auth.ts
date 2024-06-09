import express, { Request, Response } from 'express'
import { login, logout, signup } from '../controllers/authController'
import { authMiddleware } from '../middlewares/authMiddleware'

const router = express.Router()
//Login route
// router.use(authMiddleware)
router.post('/signup', signup)
router.post('/login', login)
router.post('/logout', logout)

export default router
