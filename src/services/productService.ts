import { db } from '../dbs/db'
import { and, eq } from 'drizzle-orm'
import { ProductTable } from '../dbs/schema'
import { ProductDTO, ProductInsertDTO } from '../dto/productDTO'
import { BadRequestError } from '../errors/BadRequestError'
import logger from '../utils/logger'
import { ProviderDTO } from '../dto/providerDTO'

const createProduct = async (
  productPayload: ProductInsertDTO,
): Promise<ProductInsertDTO | undefined> => {
  const newProduct: any = await db.insert(ProductTable).values({
    productName: productPayload.productName,
    description: productPayload.description,
    length: productPayload.length,
    width: productPayload.width,
    height: productPayload.height,
    weight: productPayload.weight,
    warranty: productPayload.warranty,
    categoryID: productPayload.categoryID,
    providerID: productPayload.providerID,
  })
  return newProduct
}

const updateProduct = async (productPayload: ProductDTO) => {
  const updatedProduct = await db
    .update(ProductTable)
    .set({
      productName: productPayload.productName,
      description: productPayload.description,
      length: productPayload.length,
      width: productPayload.width,
      height: productPayload.height,
      weight: productPayload.weight,
      warranty: productPayload.warranty,
      categoryID: productPayload.categoryID,
      providerID: productPayload.providerID,
    })
    .where(eq(ProductTable.productID, productPayload.productID))
    .returning()
}

const deleteProduct = async (productID: any) => {
  const deleteByID = await db
    .delete(ProductTable)
    .where(eq(ProductTable.productID, productID))
    .returning()
  return deleteByID
}

const getOneProduct = async () => {}

const getManyProduct = async () => {}

export const productService = {
  createProduct,
  updateProduct,
  deleteProduct,
  getOneProduct,
  getManyProduct,
}
