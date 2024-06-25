import { authMiddleware } from './../../middlewares/authMiddleware'
import express, { Request, Response } from 'express'
import providerController from '../../controllers/providerController'

const router = express.Router()
// router.use(authMiddleware)
//
router.get('/', authMiddleware.isAuthorized, providerController.getProviders)
router.post(
  '/',
  authMiddleware.isAuthorized,
  authMiddleware.accessTokenFromExactUser,
  authMiddleware.isAdmin,
  providerController.createProvider
)
router.patch(
  '/:id',
  authMiddleware.isAuthorized,
  authMiddleware.accessTokenFromExactUser,
  authMiddleware.isAdmin,
  providerController.updateProvider
)
router.delete(
  '/:id',
  authMiddleware.isAuthorized,
  authMiddleware.accessTokenFromExactUser,
  authMiddleware.isAdmin,
  providerController.deleteProvider
)

export default router
