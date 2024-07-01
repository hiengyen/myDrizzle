interface ReviewDTO {
  reviewID: string | null
  reviewContent: string | null
  rating: number | null
  userID: string | null
  productID: string | null
}

interface ReviewInsertDTO {
  reviewContent: string
  rating: number
  userID: string
  productID: string
}

interface ReviewUpdateDTO {
  reviewID: string
  reviewContent: string
  rating: number
}
export { ReviewDTO, ReviewInsertDTO, ReviewUpdateDTO }
