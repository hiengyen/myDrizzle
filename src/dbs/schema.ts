import {
  varchar,
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
} from 'drizzle-orm/pg-core'

export const UserRoles = pgEnum('userRoles', ['ADMIN', 'CLIENT'])

export const UsersTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  phoneNum: varchar('phoneNumber', { length: 10 }).notNull(),
  avatar: text('avatar'),
  role: UserRoles('role').default('CLIENT').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export type InsertUser = typeof UsersTable.$inferInsert
export type SelectUser = typeof UsersTable.$inferSelect
