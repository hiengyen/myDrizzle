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
} from 'drizzle-orm/pg-core'

export const UserRoles = pgEnum('userRoles', ['admin', 'client'])
export const PaymentMethod = pgEnum('paymentMethod', ['cod', 'banking'])
export const InvoiceStatus = pgEnum('invoiceStatus', [
  'new',
  'shipping',
  'done',
  'abort',
])

export const CategoryTable = pgTable('categories', {
  categoryID: uuid('id').primaryKey().defaultRandom(),
  categoryName: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('createdAt', { precision: 6, withTimezone: true })
    .notNull()
    .defaultNow(),
  updateAt: timestamp('updateAt', { precision: 6, withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const ProviderTable = pgTable('providers', {
  providerID: uuid('id').primaryKey().defaultRandom(),
  providerName: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('createdAt', { precision: 6, withTimezone: true })
    .notNull()
    .defaultNow(),
  updateAt: timestamp('updateAt', { precision: 6, withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const StoreTable = pgTable('stores', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  address: text('address'),
  phoneNum: varchar('phoneNumber', { length: 10 }),
  email: varchar('email', { length: 255 }),
  bannerUrls: text('bannerUrls').array(),
  createdAt: timestamp('createdAt', { precision: 6, withTimezone: true })
    .notNull()
    .defaultNow(),
  updateAt: timestamp('updateAt', { precision: 6, withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const AttributeTypeTable = pgTable('attributeType', {
  typeID: uuid('id').primaryKey().defaultRandom(),
  typeValue: text('value').notNull(),
  createdAt: timestamp('createdAt', { precision: 6, withTimezone: true })
    .notNull()
    .defaultNow(),
  updateAt: timestamp('updateAt', { precision: 6, withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})
export const AttributeOptionTable = pgTable('attributeOption', {
  optionID: text('id').primaryKey(),
  optionValue: text('value').notNull(),
  typeID: text('typeID')
    .notNull()
    .references((): any => AttributeTypeTable.typeID),
})

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

export const ProductTable = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  length: real('length').notNull(),
  width: real('width').notNull(),
  height: real('height').notNull(),
  weight: real('weight').notNull(),
  warranty: real('waranty').notNull(),
  categoryID: uuid('caregoryID').references(
    (): any => CategoryTable.categoryID,
  ),
  providerID: uuid('providerID').references(
    (): any => ProviderTable.providerID,
  ),
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

export const ProductItemTable = pgTable('productItems', {
  id: uuid('id').primaryKey().defaultRandom(),
  thump: text('thumpnail').notNull(),
  quantity: smallint('quantity').notNull(),
  price: real('price').notNull(),
  productCode: text('productCode').unique(),
  discount: real('discount').default(0),
  colourName: text('coulour').notNull(),
  storageName: text('storage'),
  productID: uuid('productID').references((): any => ProductTable.id),
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

export const ProductAttributeTable = pgTable('productItems', {
  productID: text('productID')
    .notNull()
    .references((): any => ProductTable.id),
  optionID: text('optionID')
    .notNull()
    .references((): any => AttributeOptionTable.optionID),
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

export const ItemImageTable = pgTable('itemImage', {
  imageID: text('id').primaryKey(),
  src: text('source').notNull(),
  itemID: text('itemID')
    .notNull()
    .references((): any => ProductItemTable.id),
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

export const ReviewTable = pgTable('review', {
  reviewID: text('id').primaryKey(),
  reviewContent: text('content').notNull(),
  rating: smallint('rating').default(5),
  productID: text('productID')
    .notNull()
    .references((): any => ProductTable.id),
  userID: text('userID')
    .notNull()
    .references((): any => UsersTable.id),
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

export const InvoiceTable = pgTable('invoices', {
  invoiceID: text('id').primaryKey(),
  status: InvoiceStatus('status').notNull(),
  payment: PaymentMethod('payment').notNull(),
  city: text('city').notNull(),
  ward: text('ward').notNull(),
  province: text('province').notNull(),
  phoneNum: text('phoneNumber').notNull(),
  detailAddress: text('detailAddress').notNull(),
  userID: text('userID')
    .notNull()
    .references((): any => UsersTable.id),
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

export const InvoiceProductTable = pgTable('invoiceProduct', {
  discount: real('discount'),
  price: real('price').notNull(),
  productName: text('productName').notNull(),
  quantity: smallint('quantity').notNull(),
  invoiceID: text('invoiceID ').references((): any => InvoiceTable.invoiceID),
  productID: text('productID').references((): any => ProductTable.id),
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
  slideID: text('id').primaryKey(),
  url: text('url').notNull(),
  alt: text('alt').notNull(),
  storeID: text('storeID')
    .notNull()
    .references((): any => StoreTable.id),

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

export type InsertUser = typeof UsersTable.$inferInsert
export type SelectUser = typeof UsersTable.$inferSelect
