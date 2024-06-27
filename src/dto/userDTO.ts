import { UserRoles } from './enum'

interface UserResponseDTO {
  userID: string
  userName: string
  email: string
  phoneNum: string | null
  avatar: string | null
  role: string
  createdAt: Date
  updateAt: Date
}

interface UserResponseSummaryDTO {
  userID: string
  userName: string
  avatar: string | null
  role: string
}

interface UserDTO {
  userID: string
  userName: string
  email: string
  password: string
  phoneNum: string | null
  avatar: string | null
  role: string
  refreshTokenUsed: string[] | null
  createdAt: Date
  updateAt: Date
}

interface UserUpdateDTO {
  userID: string
  userName: string
  email: string
  phoneNum: string | null
  avatar: string | null
}

interface UserInsertDTO {
  userName: string
  email: string
  password: string
  role: UserRoles
}

interface UserInTokenPayloadDTO {
  id: string
  role: string
}

interface RefreshTokenUseds {
  refreshTokenUsed: string[] | null
}

export {
  RefreshTokenUseds,
  UserResponseDTO,
  UserUpdateDTO,
  UserInsertDTO,
  UserInTokenPayloadDTO,
  UserResponseSummaryDTO,
  UserDTO,
}
