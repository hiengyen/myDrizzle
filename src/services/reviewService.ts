import { db } from '../dbs/db'
import { and, eq } from 'drizzle-orm'
import { ReviewDTO, ReviewInsertDTO } from '../dto/reviewDTO'
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

const createReview = async (reviewPayload: ReviewInsertDTO) => {
  await db.insert(ReviewTable).values({
    reviewContent: reviewPayload.reviewContent,
    rating: reviewPayload.rating,
    userID: reviewPayload.userID,
    productID: reviewPayload.productID,
  })
}

const deleteReview = async (reviewID: string): Promise<string | undefined> => {
  const deletedProviderID: { id: string }[] = await db
    .delete(ReviewTable)
    .where(eq(ReviewTable.reviewID, reviewID))
    .returning({ id: ReviewTable.reviewID })

  if (!deletedProviderID || deletedProviderID.length === 0) {
    return undefined
  }
  return deletedProviderID[0].id
}
const updateReview = async (
  reviewPayload: ReviewInsertDTO,
  reviewID: string,
) => {
  await db
    .update(ReviewTable)
    .set({
      reviewContent: reviewPayload.reviewContent,
      rating: reviewPayload.rating,
      userID: reviewPayload.userID,
      productID: reviewPayload.userID,
    })
    .where(eq(ReviewTable.reviewID, reviewID))
    .returning()
}

export const reviewService = {
  getReview,
  getReviewByID,
  createReview,
  deleteReview,
  updateReview,
}
