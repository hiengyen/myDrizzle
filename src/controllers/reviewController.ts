import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import logger from '../utils/logger'
import { BadRequestError } from '../errors/BadRequestError'
import { ConflictError } from '../errors/ConflictError'
import { reviewService } from '../services/reviewService'
import { ReviewDTO, ReviewInsertDTO } from '../dto/reviewDTO'

const getOneReviewHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const reviewID: string = req.params.id

  const getReview: unknown = await reviewService.getReviewByID(reviewID)

  if (!getReview) {
    throw new BadRequestError('Can not find review')
  }

  res.status(StatusCodes.OK).json({
    message: 'Get Review success',
    metadata: getReview,
  })
}

const getManyReviewHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const getManyReview: ReviewDTO[] | undefined = await reviewService.getReview()

  if (!getManyReview) {
    throw new BadRequestError('Can not find review')
  }

  res.status(StatusCodes.OK).json({
    message: 'Get Review success',
    metadata: {
      reviews: getManyReview,
    },
  })
}

const createReviewHandler = async (req: Request, res: Response) => {
  const reviewPayload: ReviewInsertDTO = {
    ...req.body,
    userID: req.header('User-id'),
    productID: req.params.id,
  }

  const newReview: unknown = await reviewService.createReview(reviewPayload)

  if (!newReview) {
    throw new BadRequestError('Can not create ')
  }

  res.status(StatusCodes.CREATED).json({
    message: 'Create Review success',
  })
}

const updateReviewHandler = async (req: Request, res: Response) => {
  const reviewID: string = req.params.id
  const reviewPayload: ReviewInsertDTO = {
    ...req.body,
  }

  const updateReview: unknown = await reviewService.updateReview(
    reviewPayload,
    reviewID,
  )

  if (!updateReview) {
    throw new BadRequestError('Can not update ')
  }

  logger.info(`Update review with id: ${req.params.id} successfull`)
  res.status(StatusCodes.OK).json({
    message: 'Update Review success',
  })
}

const deleteReviewHandler = async (req: Request, res: Response) => {
  const deleteReview: unknown = await reviewService.deleteReview(req.params.id)
  if (!deleteReview) {
    logger.error('Delete review failure: review not found')
    throw new ConflictError('Provider not found')
  }

  logger.info(`Delete provider with id: ${req.params.id} successfull`)
  res.status(StatusCodes.OK).json({
    message: 'Delete provider successfull',
  })
}

export const reviewController = {
  createReviewHandler,
  updateReviewHandler,
  deleteReviewHandler,
  getOneReviewHandler,
  getManyReviewHandler,
}
