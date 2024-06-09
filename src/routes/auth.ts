import express, { Request, Response } from 'express'
import { signup } from '../controllers/authController'

const router = express.Router()
//Login route
router.post('/signup', signup)

export default router
