interface CategoryDTO {
  id: string
  name: string
  createdAt: Date
  updateAt: Date
}

interface CategoryInsertDTO {
  name: string
}

interface CategoryUpdateDTO {
  id: string
  name: string
}

export { CategoryDTO, CategoryInsertDTO, CategoryUpdateDTO }
