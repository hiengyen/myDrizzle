import { authMiddleware } from './../../middlewares/authMiddleware'
import express from 'express'
import productController from '../../controllers/productController'

const router = express.Router()
// router.use(authMiddleware)
//
router.get('/', authMiddleware.isAuthorized, productController.getProducts)
router.post(
  '/cartitems',
  authMiddleware.isAuthorized,
  productController.getSpecificIDs
)
router.post(
  '/',
  [
    authMiddleware.isAuthorized,
    authMiddleware.accessTokenFromExactUser,
    authMiddleware.isAdmin,
  ],
  productController.createProductHandler
)
router.get('/:id', authMiddleware.isAuthorized, productController.getProduct)
router.get('/', authMiddleware.isAuthorized, productController.getProducts)
router.patch(
  '/:id',
  [
    authMiddleware.isAuthorized,
    authMiddleware.accessTokenFromExactUser,
    authMiddleware.isAdmin,
  ],
  productController.updateProductHandler
)
router.delete(
  '/:id',
  [
    authMiddleware.isAuthorized,
    authMiddleware.accessTokenFromExactUser,
    authMiddleware.isAdmin,
  ],
  productController.deleteProductHandler
)

export default router
