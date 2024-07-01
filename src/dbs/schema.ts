import {
  smallint,
  real,
  varchar,
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core'

export const UserRoles = pgEnum('userRoles', ['ADMIN', 'CLIENT'])
export const PaymentMethod = pgEnum('paymentMethod', ['COD', 'BANKING'])
export const InvoiceStatus = pgEnum('invoiceStatus', [
  'NEW',
  'SHIPPING',
  'DONE',
  'ABORT',
])

export const CategoryTable = pgTable('Category', {
  categoryID: uuid('categoryID').primaryKey().defaultRandom(),
  categoryName: varchar('categoryName', { length: 255 }).notNull(),
})

export const ProviderTable = pgTable('Provider', {
  providerID: uuid('providerID').primaryKey().defaultRandom(),
  providerName: varchar('providerName', { length: 255 }).notNull(),
})

export const StoreTable = pgTable('Store', {
  storeID: uuid('storeID').primaryKey().defaultRandom(),
  storeName: varchar('storeName', { length: 255 }).notNull(),
  description: text('description'),
  address: text('address'),
  phoneNumber: varchar('phoneNumber', { length: 10 }),
  email: varchar('email', { length: 255 }),
  bannerUrls: text('bannerUrls').array(),
})

export const AttributeTypeTable = pgTable('AttributeType', {
  typeID: uuid('typeID').primaryKey().defaultRandom(),
  typeValue: text('typeValue').notNull(),
})

export const AttributeOptionTable = pgTable('AttributeOption', {
  optionID: uuid('optionID').primaryKey().defaultRandom(),
  optionValue: text('optionValue').notNull(),
  typeID: uuid('typeID')
    .notNull()
    .references((): any => AttributeTypeTable.typeID),
})

export const ProductAttributeTable = pgTable('ProductAttribute', {
  productID: uuid('productID')
    .notNull()
    .references((): any => ProductTable.productID),
  optionID: uuid('optionID')
    .notNull()
    .references((): any => AttributeOptionTable.optionID),
})

export const UserTable = pgTable('User', {
  userID: uuid('userID').primaryKey().defaultRandom(),
  userName: varchar('userName', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  phoneNum: varchar('phoneNumber', { length: 10 }),
  avatar: text('avatar'),
  isBanned: boolean('isBanned').default(false).notNull(),
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

export const ProductTable = pgTable('Product', {
  productID: uuid('productID').primaryKey().defaultRandom(),
  productName: varchar('productName', { length: 255 }).notNull(),
  description: text('description'),
  length: real('length').notNull(),
  width: real('width').notNull(),
  height: real('height').notNull(),
  weight: real('weight').notNull(),
  warranty: real('warranty').notNull(),
  categoryID: uuid('categoryID').references(
    (): any => CategoryTable.categoryID
  ),
  providerID: uuid('providerID').references(
    (): any => ProviderTable.providerID
  ),
})

export const ProductItemTable = pgTable('ProductItem', {
  itemID: uuid('itemID').primaryKey().defaultRandom(),
  thump: text('thump').notNull(),
  quantity: smallint('quantity').notNull(),
  price: real('price').notNull(),
  productCode: text('productCode').notNull(),
  discount: real('discount').default(0),
  colorName: text('color').notNull(),
  storageName: text('storage'),
  productID: uuid('productID').references((): any => ProductTable.productID),
})

export const ItemImageTable = pgTable('ItemImage', {
  imageID: uuid('imageID').primaryKey().defaultRandom(),
  source: text('source').notNull(),
  itemID: uuid('itemID')
    .notNull()
    .references((): any => ProductItemTable.itemID),
})

export const ReviewTable = pgTable('Review', {
  reviewID: uuid('reviewID').primaryKey().defaultRandom(),
  reviewContent: text('reviewContent').notNull(),
  rating: smallint('rating').default(5),
  productID: uuid('productID')
    .notNull()
    .references((): any => ProductTable.productID),
  userID: uuid('userID')
    .notNull()
    .references((): any => UserTable.userID),
})

export const InvoiceTable = pgTable('Invoice', {
  invoiceID: uuid('invoiceID').primaryKey().defaultRandom(),
  status: InvoiceStatus('status').notNull(),
  payment: PaymentMethod('payment').notNull(),
  city: text('city').notNull(),
  ward: text('ward').notNull(),
  province: text('province').notNull(),
  phoneNum: text('phoneNumber').notNull(),
  detailAddress: text('detailAddress').notNull(),
  userID: uuid('userID')
    .notNull()
    .references((): any => UserTable.userID),
  createdAt: timestamp('createdAt', {
    mode: 'date',
    precision: 6,
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
})

export const InvoiceProductTable = pgTable('InvoiceProduct', {
  discount: real('discount'),
  price: real('price').notNull(),
  productName: text('productName').notNull(),
  quantity: smallint('quantity').notNull(),
  invoiceID: uuid('invoiceID ').references((): any => InvoiceTable.invoiceID),
  productID: uuid('productID').references((): any => ProductTable.productID),
  productCode: text('productCode'),
  colorName: text('color'),
  storageName: text('storage'),
})

export const SlideShowTable = pgTable('SlideShow', {
  slideID: uuid('slideID').primaryKey().defaultRandom(),
  url: text('url').notNull(),
  alt: text('alt').notNull(),
  storeID: uuid('storeID')
    .notNull()
    .references((): any => StoreTable.storeID),
})

export type InsertUser = typeof UserTable.$inferInsert
export type SelectUser = typeof UserTable.$inferSelect
