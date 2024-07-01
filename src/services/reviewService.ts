import { db } from '../dbs/db'
import { and, eq } from 'drizzle-orm'
import { ReviewDTO, ReviewInsertDTO, ReviewUpdateDTO } from '../dto/reviewDTO'
import { ReviewTable } from '../dbs/schema'

const getReviewByID = async (
  reviewID: string,
): Promise<ReviewDTO | undefined> => {
  const searchingReview: ReviewDTO | undefined =
    await db.query.ReviewTable.findFirst({
      where: eq(ReviewTable.reviewID, reviewID),
    })
  return searchingReview
}

const getReview = async (): Promise<ReviewDTO[] | undefined> => {
  const reviews: ReviewDTO[] = await db.select().from(ReviewTable)
  return reviews
}

const createReview = async (
  reviewPayload: ReviewInsertDTO,
): Promise<ReviewInsertDTO> => {
  const newReview: any = await db.insert(ReviewTable).values({
    ...reviewPayload,
  })
  return newReview
}

const updateReview = async (
  reviewPayload: ReviewUpdateDTO,
): Promise<ReviewUpdateDTO> => {
  const updateReview: any = await db
    .update(ReviewTable)
    .set({
      reviewContent: reviewPayload.reviewContent,
      rating: reviewPayload.rating,
    })
    .where(eq(ReviewTable.reviewID, reviewPayload.reviewID))
    .returning()

  return updateReview
}
const deleteReview = async (reviewID: string) => {
  const deleteByID = await db
    .delete(ReviewTable)
    .where(eq(ReviewTable.reviewID, reviewID))
    .returning()

  return deleteByID
}

export const reviewService = {
  getReview,
  getReviewByID,
  createReview,
  deleteReview,
  updateReview,
}
