import {
  varchar,
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
} from 'drizzle-orm/pg-core'

export const UserRoles = pgEnum('userRoles', ['admin', 'client'])

export const UsersTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  phoneNum: varchar('phoneNumber', { length: 10 }),
  avatar: text('avatar'),
  role: UserRoles('role').default('client').notNull(),
  refreshTokenUsed: text('refreshTokenUsed').array(),
  createdAt: timestamp('createdAt', { precision: 6, withTimezone: true })
    .notNull()
    .defaultNow(),
  updateAt: timestamp('updateAt', { precision: 6, withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

// export const KeyTokenTable = pgTable('keys', {
//   id: uuid('id').primaryKey().defaultRandom(),
//   userId: uuid('userId')
//     .notNull()
//     .references(() => UsersTable.id),
//   publicKey: text('publicKey').notNull(),
//   privateKey: text('privateKey').notNull(),
//   refreshTokenUsed: text('refreshTokenUsed').array(),
//   createdAt: timestamp('created_at', { precision: 6, withTimezone: true })
//     .notNull()
//     .defaultNow(),
//   updateAt: timestamp('update_at', { precision: 6, withTimezone: true })
//     .notNull()
//     .defaultNow(),
// })

export type InsertUser = typeof UsersTable.$inferInsert
export type SelectUser = typeof UsersTable.$inferSelect
