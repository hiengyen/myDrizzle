import { db } from '../dbs/db'
import { and, eq } from 'drizzle-orm'
import { CategoryInsertDTO, CategoryDTO } from '../dto/categoryDTO'
import { CategoryTable } from '../dbs/schema'

const getCategoryByID = async (
  categoryID: string
): Promise<CategoryDTO | undefined> => {
  const searchingCategory: CategoryDTO | undefined =
    await db.query.CategoryTable.findFirst({
      where: eq(CategoryTable.categoryID, categoryID),
    })
  return searchingCategory
}

const getCategoryByName = async (
  categoryName: string
): Promise<CategoryDTO[]> => {
  const categoryInDB: CategoryDTO[] = await db
    .select()
    .from(CategoryTable)
    .where(eq(CategoryTable.categoryName, categoryName))

  return categoryInDB
}

const insertCategory = async (category: CategoryInsertDTO) => {
  await db.insert(CategoryTable).values({
    categoryName: category.categoryName,
  })
}

const getCategories = async (): Promise<CategoryDTO[] | undefined> => {
  const categories: CategoryDTO[] = await db.select().from(CategoryTable)

  return categories
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
  category: CategoryDTO
): Promise<CategoryDTO | undefined> => {
  const updatedCategory: CategoryDTO[] = await db
    .update(CategoryTable)
    .set({
      categoryName: category.categoryName,
    })
    .where(and(eq(CategoryTable.categoryID, category.categoryID)))
    .returning()

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
  getCategories,
}
