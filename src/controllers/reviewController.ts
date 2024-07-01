import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import logger from '../utils/logger'
import { BadRequestError } from '../errors/BadRequestError'
import { ConflictError } from '../errors/ConflictError'
import { reviewService } from '../services/reviewService'
import { ReviewDTO, ReviewInsertDTO, ReviewUpdateDTO } from '../dto/reviewDTO'
import { db } from '../dbs/db'

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
    reviews: getManyReview,
  })
}

const createReviewHandler = async (req: Request, res: Response) => {
  const reviewPayload: ReviewInsertDTO = {
    ...req.body,
    userID: req.header('User-id'),
    productID: req.params.id,
  }

  const check = await reviewService.checkReview(reviewPayload.userID)
  if (check) {
    throw new ConflictError('Can not add review')
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
  const reviewPayload: ReviewUpdateDTO = {
    ...req.body,
  }

  const updateReview: any = await reviewService.updateReview(reviewPayload)

  if (!updateReview) {
    throw new BadRequestError('Can not update ')
  }

  logger.info(`Update review with reviewID: ${req.body.reviewID} successfull`)
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

  logger.info(`Delete review with id: ${req.params.id} successfull`)
  res.status(StatusCodes.OK).json({
    message: 'Delete review successfull',
  })
}

export const reviewController = {
  createReviewHandler,
  updateReviewHandler,
  deleteReviewHandler,
  getOneReviewHandler,
  getManyReviewHandler,
}
