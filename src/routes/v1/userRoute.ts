import { authMiddleware } from './../../middlewares/authMiddleware'
import express, { Request, Response } from 'express'
import { userController } from '../../controllers/userController'

const router = express.Router()
// router.use(authMiddleware)
//
router.post('/signup', userController.signup)
router.post('/login', userController.login)
router.delete('/logout', userController.logout)
router.post(
  '/refresh',
  authMiddleware.accessTokenFromExactUser,
  authMiddleware.refreshTokenFromExactUser,
  userController.refreshToken
)
router.post(
  '/update-info',
  authMiddleware.isAuthorized,
  authMiddleware.accessTokenFromExactUser,
  userController.updateInfo
)
export default router
