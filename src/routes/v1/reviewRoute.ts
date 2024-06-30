import { authMiddleware } from './../../middlewares/authMiddleware'
import express from 'express'
import { reviewController } from '../../controllers/reviewController'

const router = express.Router()
// router.use(authMiddleware)
//
router.get(
  '/:id',
  authMiddleware.isAuthorized,
  reviewController.getOneReviewHandler,
)

router.get(
  '/',
  authMiddleware.isAuthorized,
  authMiddleware.isAdmin,
  reviewController.getManyReviewHandler,
)

router.post(
  '/',
  authMiddleware.isAuthorized,
  authMiddleware.accessTokenFromExactUser,
  reviewController.createReviewHandler,
)

router.patch(
  '/:id',
  authMiddleware.isAuthorized,
  authMiddleware.accessTokenFromExactUser,
  reviewController.updateReviewHandler,
)

router.delete(
  '/:id',
  authMiddleware.isAuthorized,
  authMiddleware.accessTokenFromExactUser,
  reviewController.deleteReviewHandler,
)

export default router
