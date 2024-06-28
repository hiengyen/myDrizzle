import { db } from '../dbs/db'
import { and, eq, ne, sql } from 'drizzle-orm'
import {
  AttributeOptionTable,
  AttributeTypeTable,
  ProductAttributeTable,
} from '../dbs/schema'
import {
  AttributeDTO,
  AttributeOptionDTO,
  AttributeOptionInsertDTO,
  AttributeTypeDTO,
  AttributeTypeInsertDTO,
} from '../dto/attributeDTO'

const getAttributeTypeByID = async (
  typeID: string
): Promise<AttributeTypeDTO[] | undefined> => {
  const attributeTypes: AttributeTypeDTO[] = await db
    .select()
    .from(AttributeTypeTable)
    .where(eq(AttributeTypeTable.typeID, typeID))

  return attributeTypes
}

const getAttributeOptionByID = async (
  optionID: string
): Promise<AttributeOptionDTO[] | undefined> => {
  const attributeOptions: AttributeOptionDTO[] = await db
    .select()
    .from(AttributeOptionTable)
    .where(eq(AttributeOptionTable.optionID, optionID))

  return attributeOptions
}

const getAttributeTypeByValue = async (
  typeValue: string
): Promise<AttributeTypeDTO[]> => {
  const attributeTypeInDB: AttributeTypeDTO[] = await db
    .select()
    .from(AttributeTypeTable)
    .where(eq(AttributeTypeTable.typeValue, typeValue))

  return attributeTypeInDB
}

const insertAttributeType = async (attributeType: AttributeTypeInsertDTO) => {
  await db.insert(AttributeTypeTable).values({
    typeValue: attributeType.typeValue,
  })
}

const deleteAttributeType = async (
  typeID: string
): Promise<string | undefined> => {
  const deletedTypeID: { id: string }[] = await db
    .delete(AttributeTypeTable)
    .where(eq(AttributeTypeTable.typeID, typeID))
    .returning({ id: AttributeOptionTable.typeID })

  if (!deletedTypeID || deletedTypeID.length === 0) {
    return undefined
  }
  return deletedTypeID[0].id
}

const updateAttributeType = async (
  attributeType: AttributeTypeDTO
): Promise<AttributeTypeDTO | undefined> => {
  const updatedAttributeType: AttributeTypeDTO[] = await db
    .update(AttributeTypeTable)
    .set({
      typeValue: attributeType.typeValue,
    })
    .where(and(eq(AttributeTypeTable.typeID, attributeType.typeID)))
    .returning()

  if (!updatedAttributeType || updatedAttributeType.length === 0) {
    return undefined
  }
  return updatedAttributeType[0]
}

const checkIfOptionExisting = async (
  optionValue: string,
  typeID: string
): Promise<AttributeOptionDTO[]> => {
  const attributeOptionInDB: AttributeOptionDTO[] = await db
    .select()
    .from(AttributeOptionTable)
    .where(
      and(
        eq(AttributeOptionTable.optionValue, optionValue),
        eq(AttributeOptionTable.typeID, typeID)
      )
    )

  return attributeOptionInDB
}

const insertAttributeOption = async (
  attributeOption: AttributeOptionInsertDTO
) => {
  await db.insert(AttributeOptionTable).values({
    optionValue: attributeOption.optionValue,
    typeID: attributeOption.typeID,
  })
}

const deleteAttributeOption = async (
  optionID: string
): Promise<string | undefined> => {
  const deletedOptionID: { id: string }[] = await db
    .delete(AttributeOptionTable)
    .where(eq(AttributeOptionTable.optionID, optionID))
    .returning({ id: AttributeOptionTable.optionID })

  if (!deletedOptionID || deletedOptionID.length === 0) {
    return undefined
  }
  return deletedOptionID[0].id
}

const deleteAttributeOptionWithTypeID = async (
  typeID: string
): Promise<{ id: string }[] | undefined> => {
  const deletedAttributeOptionIDs: { id: string }[] | undefined = await db
    .delete(AttributeOptionTable)
    .where(eq(AttributeOptionTable.typeID, typeID))
    .returning({ id: AttributeOptionTable.optionID })
  if (!deletedAttributeOptionIDs || deletedAttributeOptionIDs.length === 0) {
    return undefined
  }
  return deletedAttributeOptionIDs
}

const updateAttributeOption = async (
  attributeOption: AttributeOptionDTO
): Promise<AttributeOptionDTO | undefined> => {
  const updatedAttributeOption: AttributeOptionDTO[] = await db
    .update(AttributeOptionTable)
    .set({
      optionValue: attributeOption.optionValue,
    })
    .where(and(eq(AttributeOptionTable.optionID, attributeOption.optionID)))
    .returning()

  if (!updatedAttributeOption || updatedAttributeOption.length === 0) {
    return undefined
  }
  return updatedAttributeOption[0]
}

const deleteProductAttributeWithOptionIDs = async (
  optionIDs: { id: string }[]
) => {
  optionIDs.map(async ob => {
    await db
      .delete(ProductAttributeTable)
      .where(eq(ProductAttributeTable.optionID, ob.id))
  })
}

const getAttributes = async () => {
  const rows = await db
    .select({
      typeID: AttributeTypeTable.typeID,
      typeValue: AttributeTypeTable.typeValue,
      option: {
        optionID: AttributeOptionTable.optionID,
        optionValue: AttributeOptionTable.optionValue,
      },
    })
    .from(AttributeTypeTable)
    .leftJoin(
      AttributeOptionTable,
      eq(AttributeTypeTable.typeID, AttributeOptionTable.typeID)
    )

  const attributes: AttributeDTO[] = rows.reduce<AttributeDTO[]>(
    (prev, row) => {
      const attribute: AttributeDTO | undefined = prev.find(
        attr => row.typeID === attr.typeID
      )
      if (attribute && row.option) {
        //If attribute found, then just push new option for that attribute
        attribute.options.push(row.option)
      } else {
        //if not found, then create new one
        const tmp: AttributeDTO = {
          typeID: row.typeID,
          typeValue: row.typeValue,
          options: [],
        }
        if (row.option) {
          tmp.options.push(row.option)
        }
        prev.push(tmp)
      }
      return prev
    },
    []
  )

  return attributes
}

export default {
  getAttributeTypeByID,
  getAttributeOptionByID,
  getAttributes,
  getAttributeTypeByValue,
  insertAttributeType,
  deleteAttributeType,
  updateAttributeType,
  checkIfOptionExisting,
  insertAttributeOption,
  deleteAttributeOption,
  deleteAttributeOptionWithTypeID,
  updateAttributeOption,
  deleteProductAttributeWithOptionIDs,
}
