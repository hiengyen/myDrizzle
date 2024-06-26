import { authMiddleware } from './../../middlewares/authMiddleware'
import express from 'express'
import categoryController from '../../controllers/categoryController'

const router = express.Router()
// router.use(authMiddleware)
//
router.get('/', authMiddleware.isAuthorized, categoryController.getCategorys)
router.post(
  '/',
  authMiddleware.isAuthorized,
  authMiddleware.accessTokenFromExactUser,
  authMiddleware.isAdmin,
  categoryController.createCategory
)
router.patch(
  '/:id',
  authMiddleware.isAuthorized,
  authMiddleware.accessTokenFromExactUser,
  authMiddleware.isAdmin,
  categoryController.updateCategory
)
router.delete(
  '/:id',
  authMiddleware.isAuthorized,
  authMiddleware.accessTokenFromExactUser,
  authMiddleware.isAdmin,
  categoryController.deleteCategory
)

export default router
