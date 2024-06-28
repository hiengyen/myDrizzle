import { authMiddleware } from './../../middlewares/authMiddleware'
import express from 'express'
import attributeController from '../../controllers/attributeController'

const router = express.Router()
// router.use(authMiddleware)
//
router.get('/', authMiddleware.isAuthorized, attributeController.getAttributes)
router.post(
  '/types',
  authMiddleware.isAuthorized,
  authMiddleware.accessTokenFromExactUser,
  authMiddleware.isAdmin,
  attributeController.createAttributeType
)
router.patch(
  '/types/:id',
  authMiddleware.isAuthorized,
  authMiddleware.accessTokenFromExactUser,
  authMiddleware.isAdmin,
  attributeController.updateAttributeType
)
router.delete(
  '/types/:id',
  authMiddleware.isAuthorized,
  authMiddleware.accessTokenFromExactUser,
  authMiddleware.isAdmin,
  attributeController.deleteAttributeType
)
router.post(
  '/options',
  authMiddleware.isAuthorized,
  authMiddleware.accessTokenFromExactUser,
  authMiddleware.isAdmin,
  attributeController.createAttributeOption
)
router.patch(
  '/options/:id',
  authMiddleware.isAuthorized,
  authMiddleware.accessTokenFromExactUser,
  authMiddleware.isAdmin,
  attributeController.updateAttributeOption
)
router.delete(
  '/options/:id',
  authMiddleware.isAuthorized,
  authMiddleware.accessTokenFromExactUser,
  authMiddleware.isAdmin,
  attributeController.deleteAttributeOption
)
export default router
