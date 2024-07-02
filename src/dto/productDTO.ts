interface ProductDTO {
  productID: string
  productName: string
  description: string | null
  length: number
  width: number
  height: number
  weight: number
  warranty: number
  categoryName: string | null
  providerName: string | null
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
  options: string[]
  productItems: ProductItemInsertDTO[]
}

interface ProductItemInsertDTO {
  thump: string
  quantity: number
  price: number
  productCode: string
  discount: number
  colorName: string
  storageName: string
  images: string[]
}

interface ItemImageDTO {
  itemID: string
  source: string
}

interface ProductOptionDTO {
  productID: string
  optionID: string
}

interface ProductUpdateDTO {
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
  options: string[]
  productItems: ProductItemDTO[]
}
interface ProductItemDTO {
  itemID: string
  thump: string
  quantity: number
  price: number
  productCode: string
  discount: number | null
  colorName: string
  storageName: string | null
  images: string[]
}

interface ProductFullJoinDTO {
  productID: string
  productName: string
  description: string | null
  length: number
  width: number
  height: number
  weight: number
  warranty: number
  categoryID: string | null
  providerID: string | null
  options: (string | null)[]
  items: {
    itemID: string | null
    thump: string | null
    quantity: number | null
    price: number | null
    productCode: string | null
    discount: number | null
    colorName: string | null
    storageName: string | null
    images: string[]
  }[]
}

export {
  ProductDTO,
  ProductInsertDTO,
  ProductItemInsertDTO,
  ProductItemDTO,
  ItemImageDTO,
  ProductOptionDTO,
  ProductUpdateDTO,
  ProductFullJoinDTO,
}
