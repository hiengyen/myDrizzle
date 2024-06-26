import { db } from '../dbs/db'
import { and, eq } from 'drizzle-orm'
import {
  CategoryInsertDTO,
  CategoryDTO,
  CategoryUpdateDTO,
} from '../dto/categoryDTO'
import { CategoryTable } from '../dbs/schema'

const getCategoryByID = async (
  categoryID: string
): Promise<CategoryDTO | undefined> => {
  const searchingCategory: CategoryDTO | undefined =
    await db.query.UsersTable.findFirst({
      where: eq(CategoryTable.categoryID, categoryID),
    })
  return searchingCategory
}

const getCategoryByName = async (
  categoryName: string
): Promise<CategoryDTO[]> => {
  const categoryInDB: CategoryDTO[] = await db
    .select({
      id: CategoryTable.categoryID,
      name: CategoryTable.categoryName,
      createdAt: CategoryTable.createdAt,
      updateAt: CategoryTable.updateAt,
    })
    .from(CategoryTable)
    .where(eq(CategoryTable.categoryName, categoryName))

  return categoryInDB
}

const insertCategory = async (category: CategoryInsertDTO) => {
  await db.insert(CategoryTable).values({
    categoryName: category.name,
  })
}

const getCategorys = async (): Promise<CategoryDTO[] | undefined> => {
  const categorys: CategoryDTO[] = await db
    .select({
      id: CategoryTable.categoryID,
      name: CategoryTable.categoryName,
      createdAt: CategoryTable.createdAt,
      updateAt: CategoryTable.updateAt,
    })
    .from(CategoryTable)

  return categorys
}

const deleteCategory = async (
  categoryID: string
): Promise<string | undefined> => {
  const deletedCategoryID: { id: string }[] = await db
    .delete(CategoryTable)
    .where(eq(CategoryTable.categoryID, categoryID))
    .returning({ id: CategoryTable.categoryID })

  if (!deletedCategoryID || deletedCategoryID.length === 0) {
    return undefined
  }
  return deletedCategoryID[0].id
}

const updateCategory = async (
  category: CategoryUpdateDTO
): Promise<CategoryDTO | undefined> => {
  const updatedCategory: CategoryDTO[] = await db
    .update(CategoryTable)
    .set({
      categoryName: category.name,
    })
    .where(and(eq(CategoryTable.categoryID, category.id)))
    .returning({
      id: CategoryTable.categoryID,
      name: CategoryTable.categoryName,
      createdAt: CategoryTable.createdAt,
      updateAt: CategoryTable.updateAt,
    })

  if (!updatedCategory || updatedCategory.length === 0) {
    return undefined
  }
  return updatedCategory[0]
}

export default {
  getCategoryByID,
  getCategoryByName,
  insertCategory,
  updateCategory,
  deleteCategory,
  getCategorys,
}
