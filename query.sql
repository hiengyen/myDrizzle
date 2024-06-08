create type AccountRoll as enum('ADMIN', 'USER');
create type InvoiceStatus as enum('NEW', 'SHIPPING', 'DONE', 'ABORT');
create type PaymentMethod as enum('COD', 'BANKING');

create table Provider (
  providerID text primary key,
  providerName text not null
);

create table Category (
  categoryID text primary key,
  categoryName text not null
);

create table Store (
  storeID text primary key,
  storeName text not null,
  description text,
  address text,
  phoneNumber text,
  email text,
  bannerUrls text[]
);

create table AttributeType (
  typeID text primary key,
  typeValue text not null
);

create table Account (
  accountID text primary key,
  accountName text not null,
  avt text,
  phoneNumber text,
  createAt timestamp(3),
  editedAt timestamp(3),
  isBanned boolean default(false),
  email text not null,
  passwd text not null,
  refreshToken text not null,
  refreshTokenUsed text[],
  roll AccountRoll not null
);

create table Product (
  productID text primary key,
  productName text not null,
  description text,
  height float not null,
  weight float not null,
  len float not null,
  width float not null,
  gurantee float not null,
  categoryID text not null references Category(categoryID),
  providerID text not null references Provider(providerID)
);

create table ProductItem (
  itemID text primary key,
  thump text not null,
  quantity integer not null,
  price float not null,
  productCode text unique,
  discount float default(0),
  colorName text not null,
  storageName text,
  productID text not null references Product(productID)
);

create table AttributeOption (
  optionID text primary key,
  optionValue text not null,
  typeID text not null references AttributeType(typeID)
);

create table ProductAttribute (
  productID text not null references Product(productID),
  optionID text not null references AttributeOption(optionID)
);

create table ItemImage (
  imageID text primary key,
  src text not null,
  itemID text not null references ProductItem(itemID)
);

create table Review (
  reviewID text primary key,
  reviewContent text not null,
  rating integer default(5),
  createdAt timestamp(3) default current_timestamp,
  productID text not null references Product(productID),
  accountID text not null references Account(accountID)
);

create table Invoice (
  invoiceID text primary key,
  status InvoiceStatus not null,
  payment PaymentMethod not null,
  city text not null,
  ward text not null,
  province text not null,
  phoneNumber text not null,
  detailAddress text not null,
  createdAt timestamp(3) default current_timestamp,
  accountID text not null references Account(accountID)
);

create table InvoiceProduct (
  discount float,
  price float not null,
  productName text not null,
  quantity integer not null,
  invoiceID text references Invoice(invoiceID),
  productID text references Product(productID)
);

create table SlideShow (
  slide_id text primary key,
  url text not null,
  alt text not null,
  storeID text not null references Store(storeID)
);
