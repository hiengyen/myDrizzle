import express, { Request, Response } from 'express'
import { userController } from '../../controllers/userController'
import { authMiddleware } from '../../middlewares/authMiddleware'

const router = express.Router()
// router.use(authMiddleware)
//
router.post('/signup', userController.signup)
router.post('/login', authMiddleware.isAuthorized, userController.login)
router.delete('/logout', authMiddleware.isAuthorized, userController.logout)
router.post('/refresh_token', userController.refreshToken)
export default router
