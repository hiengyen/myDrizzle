import { db } from '../dbs/db'
import { ne, and, eq, inArray, notInArray } from 'drizzle-orm'
import {
  CategoryTable,
  ItemImageTable,
  ProductAttributeTable,
  ProductItemTable,
  ProductTable,
  ProviderTable,
} from '../dbs/schema'
import {
  ProductInsertDTO,
  ProductItemInsertDTO,
  ProductItemDTO,
  ItemImageDTO,
  ProductOptionDTO,
  ProductUpdateDTO,
  ProductDTO,
  ProductFullJoinDTO,
} from '../dto/productDTO'
import logger from '../utils/logger'
import { BadRequestError } from '../errors/BadRequestError'

const getProductOptionDTOs = (
  productID: string,
  options: string[]
): ProductOptionDTO[] => {
  return options.reduce<ProductOptionDTO[]>((prev, curr) => {
    prev.push({ productID: productID, optionID: curr })
    return prev
  }, [])
}

const getProductImageInsertDTOs = (
  productItems: ProductItemInsertDTO[] | ProductItemDTO[],
  productItemIDs: { itemID: string }[]
): ItemImageDTO[] => {
  let i = 0
  return productItems.reduce<ItemImageDTO[]>((prev, curr) => {
    curr.images.forEach(image => {
      prev.push({ itemID: productItemIDs[i].itemID, source: image })
    })
    i++
    return prev
  }, [])
}

const createProduct = async (product: ProductInsertDTO) => {
  // await db.transaction(async trx => {
  //Insert into Product
  const productID: string = (
    await db
      .insert(ProductTable)
      .values({ ...product })
      .returning({ productID: ProductTable.productID })
  )[0].productID

  //Insert into ProductItemTable
  const productItemIDs: { itemID: string }[] = await db
    .insert(ProductItemTable)
    .values(
      product.productItems.map(item => ({
        ...item,
        productID: productID,
      }))
    )
    .returning({ itemID: ProductItemTable.itemID })

  //Insert into ProductImageTable
  const itemImages: ItemImageDTO[] = getProductImageInsertDTOs(
    product.productItems,
    productItemIDs
  )
  if (itemImages.length !== 0) {
    logger.info(`insert into image table values : ${itemImages.length}}`)
    await db.insert(ItemImageTable).values(itemImages)
  }

  //Insert into ProductAttributeTable
  const productOptions: ProductOptionDTO[] = getProductOptionDTOs(
    productID,
    product.options
  )

  if (productOptions.length !== 0) {
    await db.insert(ProductAttributeTable).values(productOptions)
  }
  // })
}

const updateProduct = async (product: ProductUpdateDTO, productID: string) => {
  // await db.transaction(async trx => {
  //Update ProductTable
  const deletedItemIDBucket: string[] = (
    await db
      .select({ itemID: ProductItemTable.itemID })
      .from(ProductItemTable)
      .where(eq(ProductItemTable.productID, productID))
  ).map(e => e.itemID)
  if (deletedItemIDBucket.length === 0) {
    logger.error('Create product failure: items not found')
    throw new BadRequestError('Items not found')
  }
  logger.info('into batch')
  await db.batch([
    db
      .update(ProductTable)
      .set(product)
      .where(eq(ProductTable.productID, productID)),
    db
      .delete(ProductAttributeTable)
      .where(eq(ProductAttributeTable.productID, productID)),
    db
      .delete(ItemImageTable)
      .where(inArray(ItemImageTable.itemID, deletedItemIDBucket)),
    db
      .delete(ProductItemTable)
      .where(eq(ProductItemTable.productID, productID)),
  ])

  logger.info('updateItem')
  //update ProductItemTable
  const productItemIDs: { itemID: string }[] = await db
    .insert(ProductItemTable)
    .values(
      product.productItems.map(item => ({
        ...item,
        productID: productID,
      }))
    )
    .returning({ itemID: ProductItemTable.itemID })

  //update ProductImageTable
  const itemImages: ItemImageDTO[] = getProductImageInsertDTOs(
    product.productItems,
    productItemIDs
  )
  await db.insert(ItemImageTable).values(itemImages)

  //update ProductAttributeTable
  const productOptions: ProductOptionDTO[] = getProductOptionDTOs(
    productID,
    product.options
  )
  if (productOptions.length !== 0) {
    await db.insert(ProductAttributeTable).values(productOptions)
  }
  // })
}

const deleteProduct = async (productID: string): Promise<string[]> => {
  const deletedItemIDBucket: string[] = (
    await db
      .select({ itemID: ProductItemTable.itemID })
      .from(ProductItemTable)
      .where(eq(ProductItemTable.productID, productID))
  ).map(e => e.itemID)

  const rawData = await db.batch([
    db
      .delete(ItemImageTable)
      .where(inArray(ItemImageTable.itemID, deletedItemIDBucket))
      .returning({ source: ItemImageTable.source }),
    db
      .delete(ProductAttributeTable)
      .where(eq(ProductAttributeTable.productID, productID)),
    db
      .delete(ProductItemTable)
      .where(eq(ProductItemTable.productID, productID))
      .returning({ thump: ProductItemTable.thump }),
    db.delete(ProductTable).where(eq(ProductTable.productID, productID)),
  ])
  return rawData[0].map(e => e.source)
}

const checkProductExisting = async (productID: string) => {
  const productIDs: { productID: string }[] = await db
    .select({ productID: ProductTable.productID })
    .from(ProductTable)
    .where(eq(ProductTable.productID, productID))
  return productIDs.length !== 0
}

const checkItemCodeDuplicatedInUpdateTransaction = async (
  productID: string,
  upcommingProductItems: ProductItemDTO[]
): Promise<boolean> => {
  //get update code arrays, this cannot be empty
  const codeArray: string[] = getProductItemCodeArray(upcommingProductItems)
  if (checkProductItemCodeDuplicated(codeArray)) {
    return true
  }

  //get productCodes from data than not belong to productID'items
  //if this is empty, return false(that mean there are no conflict, free to update)
  const productCodes: string[] = (
    await db
      .select({ productCode: ProductItemTable.productCode })
      .from(ProductItemTable)
      .where(ne(ProductItemTable.productID, productID))
  )
    .map(e => e.productCode)
    .reduce((prev, curr) => {
      curr ?? prev.push()
      return prev
    }, [])
  if (productCodes.length === 0) return false

  const duplicatedCodes = await db
    .select({ productCode: ProductItemTable.productCode })
    .from(ProductItemTable)
    .where(
      and(
        inArray(ProductItemTable.productCode, codeArray),
        inArray(ProductItemTable.itemID, productCodes)
      )
    )
  return duplicatedCodes.length !== 0
}

const checkItemCodeDuplicatedInInsertTransaction = async (
  upcommingProductItems: ProductItemInsertDTO[]
): Promise<boolean> => {
  //get insert code arrays, this cannot be empty
  const codeArray: string[] = getProductItemCodeArray(upcommingProductItems)
  if (checkProductItemCodeDuplicated(codeArray)) {
    return true
  }
  //get productCodes from data than not belong to productID'items
  const duplicatedCodes = await db
    .select({ productCode: ProductItemTable.productCode })
    .from(ProductItemTable)
    .where(and(inArray(ProductItemTable.productCode, codeArray)))
  return duplicatedCodes.length !== 0
}

const checkProductItemCodeDuplicated = (productCodes: string[]): boolean => {
  const bucket = new Set(productCodes)
  return bucket.size !== productCodes.length
}

const getProductItemCodeArray = (
  productItems: ProductItemInsertDTO[] | ProductItemDTO[]
): string[] => {
  const result = productItems.reduce<string[]>((prev, curr) => {
    curr.productCode && prev.push(curr.productCode)
    return prev
  }, [])
  return result
}

const getProductItemIDArray = (productItems: ProductItemDTO[]): string[] => {
  const result = productItems.reduce<string[]>((prev, curr) => {
    prev.push(curr.itemID)
    return prev
  }, [])
  return result
}

const getProductsSummary = async (): Promise<ProductDTO[]> => {
  const products: ProductDTO[] = await db
    .select({
      productID: ProductTable.productID,
      productName: ProductTable.productName,
      description: ProductTable.description,
      length: ProductTable.length,
      width: ProductTable.width,
      height: ProductTable.height,
      weight: ProductTable.weight,
      warranty: ProductTable.warranty,
      categoryName: CategoryTable.categoryName,
      providerName: ProviderTable.providerName,
    })
    .from(ProductTable)
    .leftJoin(
      CategoryTable,
      eq(CategoryTable.categoryID, ProductTable.categoryID)
    )
    .leftJoin(
      ProviderTable,
      eq(ProviderTable.providerID, ProductTable.providerID)
    )
  return products
}

const getProductFullJoinDTO = async (
  productID: string
): Promise<ProductFullJoinDTO> => {
  // Get all data relate to product
  const rawData = await db.batch([
    db.select().from(ProductTable).where(eq(ProductTable.productID, productID)),
    db
      .select({
        itemID: ProductItemTable.itemID,
        thump: ProductItemTable.thump,
        quantity: ProductItemTable.quantity,
        price: ProductItemTable.price,
        productCode: ProductItemTable.productCode,
        discount: ProductItemTable.discount,
        colorName: ProductItemTable.colorName,
        storageName: ProductItemTable.storageName,
        source: ItemImageTable.source,
      })
      .from(ProductItemTable)
      .where(eq(ProductItemTable.productID, productID))
      .leftJoin(
        ItemImageTable,
        eq(ItemImageTable.itemID, ProductItemTable.itemID)
      ),
    db
      .select({ optionID: ProductAttributeTable.optionID })
      .from(ProductAttributeTable)
      .where(eq(ProductAttributeTable.productID, productID)),
  ])
  //Make product
  const product: ProductFullJoinDTO = {
    ...rawData[0][0],
    options: rawData[2].reduce<string[]>((prev, curr) => {
      prev.push(curr.optionID)
      return prev
    }, []),
    items: rawData[1].reduce<ProductItemDTO[]>((prev, curr) => {
      const itemHolder: ProductItemDTO | undefined = prev.find(
        item => item.itemID === curr.itemID
      )
      if (!itemHolder) {
        const newItem: ProductItemDTO = {
          itemID: curr.itemID,
          thump: curr.thump,
          quantity: curr.quantity,
          price: curr.price,
          productCode: curr.productCode,
          discount: curr.discount,
          colorName: curr.colorName,
          storageName: curr.storageName,
          images: [],
        }
        curr.source && newItem.images?.push(curr.source)
        prev.push(newItem)
      } else {
        curr.source && itemHolder.images?.push(curr.source)
      }
      return prev
    }, []),
  }

  return product
}

const getProductWithCategoryID = async (
  categoryID: string
): Promise<ProductFullJoinDTO[]> => {
  const rows = await db
    .select({
      productID: ProductTable.productID,
      productName: ProductTable.productName,
      description: ProductTable.description,
      length: ProductTable.length,
      width: ProductTable.width,
      height: ProductTable.height,
      weight: ProductTable.weight,
      warranty: ProductTable.warranty,
      categoryID: ProductTable.categoryID,
      providerID: ProductTable.providerID,
      optionID: ProductAttributeTable.optionID,
      item: {
        itemID: ProductItemTable.itemID,
        thump: ProductItemTable.thump,
        quantity: ProductItemTable.quantity,
        price: ProductItemTable.price,
        productCode: ProductItemTable.productCode,
        discount: ProductItemTable.discount,
        colorName: ProductItemTable.colorName,
        storageName: ProductItemTable.storageName,
        source: ItemImageTable.source,
      },
    })
    .from(ProductTable)
    .where(eq(ProductTable.categoryID, categoryID))
    .leftJoin(
      ProductAttributeTable,
      eq(ProductTable.productID, ProductTable.productID)
    )
    .leftJoin(
      ProductItemTable,
      eq(ProductItemTable.productID, ProductTable.productID)
    )
    .leftJoin(
      ItemImageTable,
      eq(ItemImageTable.itemID, ProductItemTable.itemID)
    )

  const products: ProductFullJoinDTO[] = rows.reduce<ProductFullJoinDTO[]>(
    (prev, curr) => {
      const productHolder: ProductFullJoinDTO | undefined = prev.find(
        product => product.productID === curr.productID
      )
      if (
        !productHolder &&
        (curr.item.colorName ||
          curr.item.source ||
          curr.item.discount ||
          curr.item.price ||
          curr.item.productCode ||
          curr.item.quantity ||
          curr.item.storageName ||
          curr.item.thump)
      ) {
        const newProduct: ProductFullJoinDTO = {
          productID: curr.productID,
          productName: curr.productName,
          description: curr.description,
          length: curr.length,
          width: curr.width,
          height: curr.height,
          weight: curr.weight,
          warranty: curr.warranty,
          categoryID: curr.categoryID,
          providerID: curr.providerID,
          options: [curr.optionID],
          items: [
            {
              ...curr.item,
              images: curr.item.source ? [curr.item.source] : [],
            },
          ],
        }
        prev.push(newProduct)
      } else {
        if (productHolder) {
          const optionHolder: string | undefined | null =
            productHolder.options.find(option => option === curr.optionID)
          if (!optionHolder) {
            productHolder.options.push(curr.optionID)
          }

          const itemHolder = productHolder.items.find(
            item => item.itemID === curr.item.itemID
          )
          if (!itemHolder) {
            const newItem = {
              ...curr.item,
              images: curr.item.source ? [curr.item.source] : [],
            }
            productHolder.items.push(newItem)
          } else {
            curr.item.source && itemHolder.images.push(curr.item.source)
          }
        }
      }

      return prev
    },
    []
  )

  return products
}

const getProductWithProviderID = async (
  providerID: string
): Promise<ProductFullJoinDTO[]> => {
  const rows = await db
    .select({
      productID: ProductTable.productID,
      productName: ProductTable.productName,
      description: ProductTable.description,
      length: ProductTable.length,
      width: ProductTable.width,
      height: ProductTable.height,
      weight: ProductTable.weight,
      warranty: ProductTable.warranty,
      categoryID: ProductTable.categoryID,
      providerID: ProductTable.providerID,
      optionID: ProductAttributeTable.optionID,
      item: {
        itemID: ProductItemTable.itemID,
        thump: ProductItemTable.thump,
        quantity: ProductItemTable.quantity,
        price: ProductItemTable.price,
        productCode: ProductItemTable.productCode,
        discount: ProductItemTable.discount,
        colorName: ProductItemTable.colorName,
        storageName: ProductItemTable.storageName,
        source: ItemImageTable.source,
      },
    })
    .from(ProductTable)
    .where(eq(ProductTable.providerID, providerID))
    .leftJoin(
      ProductAttributeTable,
      eq(ProductTable.productID, ProductTable.productID)
    )
    .leftJoin(
      ProductItemTable,
      eq(ProductItemTable.productID, ProductTable.productID)
    )
    .leftJoin(
      ItemImageTable,
      eq(ItemImageTable.itemID, ProductItemTable.itemID)
    )
  const products: ProductFullJoinDTO[] = rows.reduce<ProductFullJoinDTO[]>(
    (prev, curr) => {
      const productHolder: ProductFullJoinDTO | undefined = prev.find(
        product => product.productID === curr.productID
      )
      if (
        !productHolder &&
        (curr.item.colorName ||
          curr.item.source ||
          curr.item.discount ||
          curr.item.price ||
          curr.item.productCode ||
          curr.item.quantity ||
          curr.item.storageName ||
          curr.item.thump)
      ) {
        const newProduct: ProductFullJoinDTO = {
          productID: curr.productID,
          productName: curr.productName,
          description: curr.description,
          length: curr.length,
          width: curr.width,
          height: curr.height,
          weight: curr.weight,
          warranty: curr.warranty,
          categoryID: curr.categoryID,
          providerID: curr.providerID,
          options: [curr.optionID],
          items: [
            {
              ...curr.item,
              images: curr.item.source ? [curr.item.source] : [],
            },
          ],
        }
        prev.push(newProduct)
      } else {
        if (productHolder) {
          const optionHolder: string | undefined | null =
            productHolder.options.find(option => option === curr.optionID)
          if (!optionHolder) {
            productHolder.options.push(curr.optionID)
          }

          const itemHolder = productHolder.items.find(
            item => item.itemID === curr.item.itemID
          )
          if (!itemHolder) {
            const newItem = {
              ...curr.item,
              images: curr.item.source ? [curr.item.source] : [],
            }
            productHolder.items.push(newItem)
          } else {
            curr.item.source && itemHolder.images.push(curr.item.source)
          }
        }
      }

      return prev
    },
    []
  )

  return products
}

const getProductsFullJoin = async (): Promise<ProductFullJoinDTO[]> => {
  const rows = await db
    .select({
      productID: ProductTable.productID,
      productName: ProductTable.productName,
      description: ProductTable.description,
      length: ProductTable.length,
      width: ProductTable.width,
      height: ProductTable.height,
      weight: ProductTable.weight,
      warranty: ProductTable.warranty,
      categoryID: ProductTable.categoryID,
      providerID: ProductTable.providerID,
      optionID: ProductAttributeTable.optionID,
      item: {
        itemID: ProductItemTable.itemID,
        thump: ProductItemTable.thump,
        quantity: ProductItemTable.quantity,
        price: ProductItemTable.price,
        productCode: ProductItemTable.productCode,
        discount: ProductItemTable.discount,
        colorName: ProductItemTable.colorName,
        storageName: ProductItemTable.storageName,
        source: ItemImageTable.source,
      },
    })
    .from(ProductTable)
    .leftJoin(
      ProductAttributeTable,
      eq(ProductTable.productID, ProductTable.productID)
    )
    .leftJoin(
      ProductItemTable,
      eq(ProductItemTable.productID, ProductTable.productID)
    )
    .leftJoin(
      ItemImageTable,
      eq(ItemImageTable.itemID, ProductItemTable.itemID)
    )

  const products: ProductFullJoinDTO[] = rows.reduce<ProductFullJoinDTO[]>(
    (prev, curr) => {
      const productHolder: ProductFullJoinDTO | undefined = prev.find(
        product => product.productID === curr.productID
      )
      if (
        !productHolder &&
        (curr.item.colorName ||
          curr.item.source ||
          curr.item.discount ||
          curr.item.price ||
          curr.item.productCode ||
          curr.item.quantity ||
          curr.item.storageName ||
          curr.item.thump)
      ) {
        const newProduct: ProductFullJoinDTO = {
          productID: curr.productID,
          productName: curr.productName,
          description: curr.description,
          length: curr.length,
          width: curr.width,
          height: curr.height,
          weight: curr.weight,
          warranty: curr.warranty,
          categoryID: curr.categoryID,
          providerID: curr.providerID,
          options: [curr.optionID],
          items: [
            {
              ...curr.item,
              images: curr.item.source ? [curr.item.source] : [],
            },
          ],
        }
        prev.push(newProduct)
      } else {
        if (productHolder) {
          const optionHolder: string | undefined | null =
            productHolder.options.find(option => option === curr.optionID)
          if (!optionHolder) {
            productHolder.options.push(curr.optionID)
          }

          const itemHolder = productHolder.items.find(
            item => item.itemID === curr.item.itemID
          )
          if (!itemHolder) {
            const newItem = {
              ...curr.item,
              images: curr.item.source ? [curr.item.source] : [],
            }
            productHolder.items.push(newItem)
          } else {
            curr.item.source && itemHolder.images.push(curr.item.source)
          }
        }
      }

      return prev
    },
    []
  )

  return products
}

const getProductsFullJoinWithID = async (
  searchingIDs: string[]
): Promise<ProductFullJoinDTO[]> => {
  const rows = await db
    .select({
      productID: ProductTable.productID,
      productName: ProductTable.productName,
      description: ProductTable.description,
      length: ProductTable.length,
      width: ProductTable.width,
      height: ProductTable.height,
      weight: ProductTable.weight,
      warranty: ProductTable.warranty,
      categoryID: ProductTable.categoryID,
      providerID: ProductTable.providerID,
      optionID: ProductAttributeTable.optionID,
      item: {
        itemID: ProductItemTable.itemID,
        thump: ProductItemTable.thump,
        quantity: ProductItemTable.quantity,
        price: ProductItemTable.price,
        productCode: ProductItemTable.productCode,
        discount: ProductItemTable.discount,
        colorName: ProductItemTable.colorName,
        storageName: ProductItemTable.storageName,
        source: ItemImageTable.source,
      },
    })
    .from(ProductTable)
    .where(inArray(ProductTable.productID, searchingIDs))
    .leftJoin(
      ProductAttributeTable,
      eq(ProductTable.productID, ProductTable.productID)
    )
    .leftJoin(
      ProductItemTable,
      eq(ProductItemTable.productID, ProductTable.productID)
    )
    .leftJoin(
      ItemImageTable,
      eq(ItemImageTable.itemID, ProductItemTable.itemID)
    )

  const products: ProductFullJoinDTO[] = rows.reduce<ProductFullJoinDTO[]>(
    (prev, curr) => {
      const productHolder: ProductFullJoinDTO | undefined = prev.find(
        product => product.productID === curr.productID
      )
      if (
        !productHolder &&
        (curr.item.colorName ||
          curr.item.source ||
          curr.item.discount ||
          curr.item.price ||
          curr.item.productCode ||
          curr.item.quantity ||
          curr.item.storageName ||
          curr.item.thump)
      ) {
        const newProduct: ProductFullJoinDTO = {
          productID: curr.productID,
          productName: curr.productName,
          description: curr.description,
          length: curr.length,
          width: curr.width,
          height: curr.height,
          weight: curr.weight,
          warranty: curr.warranty,
          categoryID: curr.categoryID,
          providerID: curr.providerID,
          options: [curr.optionID],
          items: [
            {
              ...curr.item,
              images: curr.item.source ? [curr.item.source] : [],
            },
          ],
        }
        prev.push(newProduct)
      } else {
        if (productHolder) {
          const optionHolder: string | undefined | null =
            productHolder.options.find(option => option === curr.optionID)
          if (!optionHolder) {
            productHolder.options.push(curr.optionID)
          }

          const itemHolder = productHolder.items.find(
            item => item.itemID === curr.item.itemID
          )
          if (!itemHolder) {
            const newItem = {
              ...curr.item,
              images: curr.item.source ? [curr.item.source] : [],
            }
            productHolder.items.push(newItem)
          } else {
            curr.item.source && itemHolder.images.push(curr.item.source)
          }
        }
      }

      return prev
    },
    []
  )

  return products
}

export default {
  createProduct,
  updateProduct,
  deleteProduct,
  checkProductExisting,
  getProductsSummary,
  getProductItemCodeArray,
  getProductItemIDArray,
  getProductFullJoinDTO,
  getProductWithCategoryID,
  getProductWithProviderID,
  getProductsFullJoin,
  getProductsFullJoinWithID,
}
