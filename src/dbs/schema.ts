import {
  smallint,
  bigint,
  real,
  varchar,
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  PgColumn,
} from 'drizzle-orm/pg-core'

export const UserRoles = pgEnum('userRoles', ['ADMIN', 'CLIENT'])
export const PaymentMethod = pgEnum('paymentMethod', ['COD', 'BANKING'])
export const InvoiceStatus = pgEnum('invoiceStatus', [
  'NEW',
  'SHIPPING',
  'DONE',
  'ABORT',
])

export const CategoryTable = pgTable('categories', {
  categoryID: uuid('id').primaryKey().defaultRandom(),
  categoryName: varchar('name', { length: 255 }).notNull(),
})

export const ProviderTable = pgTable('providers', {
  providerID: uuid('id').primaryKey().defaultRandom(),
  providerName: varchar('name', { length: 255 }).notNull(),
})

export const StoreTable = pgTable('stores', {
  storeID: uuid('id').primaryKey().defaultRandom(),
  storeName: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  address: text('address'),
  phoneNumber: varchar('phoneNumber', { length: 10 }),
  email: varchar('email', { length: 255 }),
  bannerUrls: text('bannerUrls').array(),
})

export const AttributeTypeTable = pgTable('attributeType', {
  typeID: uuid('id').primaryKey().defaultRandom(),
  typeValue: text('value').notNull(),
})

export const AttributeOptionTable = pgTable('attributeOption', {
  optionID: uuid('id').primaryKey().defaultRandom(),
  optionValue: text('value').notNull(),
  typeID: uuid('typeID')
    .notNull()
    .references((): any => AttributeTypeTable.typeID),
})

export const ProductAttributeTable = pgTable('productAttribute', {
  productID: uuid('productID')
    .notNull()
    .references((): any => ProductTable.productID),
  optionID: uuid('optionID')
    .notNull()
    .references((): any => AttributeOptionTable.optionID),
})

export const UsersTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  phoneNum: varchar('phoneNumber', { length: 10 }),
  avatar: text('avatar'),
  role: UserRoles('role').default('CLIENT').notNull(),
  refreshTokenUsed: text('refreshTokenUsed').array(),
  createdAt: timestamp('createdAt', { precision: 6, withTimezone: true })
    .notNull()
    .defaultNow(),
  updateAt: timestamp('updateAt', { precision: 6, withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const ProductTable = pgTable('products', {
  productID: uuid('id').primaryKey().defaultRandom(),
  productName: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  length: real('length').notNull(),
  width: real('width').notNull(),
  height: real('height').notNull(),
  weight: real('weight').notNull(),
  warranty: real('warranty').notNull(),
  categoryID: uuid('caregoryID').references(
    (): any => CategoryTable.categoryID
  ),
  providerID: uuid('providerID').references(
    (): any => ProviderTable.providerID
  ),
})

export const ProductItemTable = pgTable('productItems', {
  itemID: uuid('id').primaryKey().defaultRandom(),
  thump: text('thumpnail').notNull(),
  quantity: smallint('quantity').notNull(),
  price: real('price').notNull(),
  productCode: text('productCode').unique(),
  discount: real('discount').default(0),
  colorName: text('color').notNull(),
  storageName: text('storage'),
  productID: uuid('productID').references((): any => ProductTable.productID),
})

export const ProductAttributeTable = pgTable('productItems', {
  productID: uuid('productID')
    .notNull()
    .references((): any => ProductTable.id),
  optionID: uuid('optionID')
    .notNull()
    .references((): any => AttributeOptionTable.optionValue),
})

export const ItemImageTable = pgTable('itemImage', {
  imageID: uuid('id').primaryKey().defaultRandom(),
  src: text('source').notNull(),
  itemID: uuid('itemID')
    .notNull()
    .references((): any => ProductItemTable.itemID),
})

export const ReviewTable = pgTable('review', {
  reviewID: uuid('id').primaryKey().defaultRandom(),
  reviewContent: text('content').notNull(),
  rating: smallint('rating').default(5),
  productID: uuid('productID')
    .notNull()
    .references((): any => ProductTable.productID),
  userID: uuid('userID')
    .notNull()
    .references((): any => UsersTable.id),
})

export const InvoiceTable = pgTable('invoices', {
  invoiceID: uuid('id').primaryKey().defaultRandom(),
  status: InvoiceStatus('status').notNull(),
  payment: PaymentMethod('payment').notNull(),
  city: text('city').notNull(),
  ward: text('ward').notNull(),
  province: text('province').notNull(),
  phoneNum: text('phoneNumber').notNull(),
  detailAddress: text('detailAddress').notNull(),
  userID: uuid('userID')
    .notNull()
    .references((): any => UsersTable.id),
  createdAt: timestamp('createdAt', {
    mode: 'date',
    precision: 6,
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
})

export const InvoiceProductTable = pgTable('invoiceProduct', {
  discount: real('discount'),
  price: real('price').notNull(),
  productName: text('productName').notNull(),
  quantity: smallint('quantity').notNull(),
  invoiceID: uuid('invoiceID ').references((): any => InvoiceTable.invoiceID),
  productID: uuid('productID').references((): any => ProductTable.productID),
  createdAt: timestamp('createdAt', {
    mode: 'date',
    precision: 6,
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  updateAt: timestamp('updateAt', {
    mode: 'date',
    precision: 6,
    withTimezone: true,
  })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const SlideShowTable = pgTable('slideShow', {
  slideID: uuid('id').primaryKey().defaultRandom(),
  url: text('url').notNull(),
  alt: text('alt').notNull(),
  storeID: uuid('storeID')
    .notNull()
    .references((): any => StoreTable.storeID),
})

export type InsertUser = typeof UsersTable.$inferInsert
export type SelectUser = typeof UsersTable.$inferSelect
