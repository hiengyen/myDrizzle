interface ProductDTO {
  productID: string
  productName: string
  description: string
  length: number
  width: number
  height: number
  weight: number
  warranty: number
  categoryID: string
  providerID: string
}

interface ProductInsertDTO {
  productName: string
  description: string
  length: number
  width: number
  height: number
  weight: number
  warranty: number
  categoryID: string
  providerID: string
}

export { ProductDTO, ProductInsertDTO }
