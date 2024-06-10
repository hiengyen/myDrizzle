import express, { Request, Response } from 'express'
import {
  logInHandler,
  logOutHandler,
  signUpHandler,
} from '../controllers/authController'

const router = express.Router()
// router.use(authMiddleware)
//
router.post('/signup', signUpHandler)
router.post('/login', logInHandler)
router.post('/logout', logOutHandler)

export default router
