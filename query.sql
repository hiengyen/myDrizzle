
create type permissions as enum('admin', 'user');

create table users (
  user_id serial primary key,
  -- name  not null,
  email text not null,
  passwd text not null,
  phone_number text,
  avt text,
  status boolean not null,
  is_banned boolean default(false),
  private_key text not null,
  public_key text not null,
  refresh_token text not null,
  refresh_token_used text[],
  role permissions not null,
  created_at timestamp(3) default current_timestamp,
  editted_at timestamp(3),

);


create table color (
  color_id text primary key,
  name text not null
);

create table storage (
  storage_id text primary key,
  src text not null
);

create table branch (
  branch_id text primary key,
  name text not null
);

create table attribute_type (
  type_id text primary key,
  atr_type text not null
);

create table category (
  cate_id text primary key,
  title text not null
);

create table store (
  store_id text primary key,
  name text not null,
  description text,
  address text,
  phone_number text,
  email text,
  fb_url text,
  bannerUrls text[]
);

create table product (
  product_id text primary key,
  name text not null,
  description text,
  height text not null,
  weight text not null,
  len text not null,
  width text not null,
  gurantee text not null,
  category_id text not null references category(cate_id),
  branch_id text not null references branch(branch_id)
);

create table product_item (
  item_id text primary key,
  thump text not null,
  status boolean not null default(true),
  quantity integer not null,
  price float not null,
  is_prior boolean not null,
  product_code text,
  discount float,
  create_at timestamp(3) default current_timestamp,
  edittedAt timestamp(3),
  product_id text not null references product(product_id),
  color_id text not null references color(color_id),
  storage_id text references storage(storage_id)
);

create table attribute_option (
  option_id text primary key,
  option_value text not null,
  attribute_type_id text not null references attribute_type(type_id)
);

create table product_attribute (
  product_id text not null references product(product_id),
  attribute_option_id text not null references attribute_option(option_id)
);


create table product_image (
  image_id text primary key,
  src text not null,
  item_id text not null references product_item(item_id)
);

create table review (
  review_id text primary key,
  review_content text not null,
  rating integer default(5),
  created_at timestamp(3) default current_timestamp,
  product_id text not null references product(product_id),
  user_id text not null references users(user_id)
);
 
create type orderstatus as enum('NEW', 'SHIPPING', 'DONE', 'ABORT');
create type paymentmethod as enum('COD', 'BANKING');

create table orders (
  order_id text primary key,
  status orderstatus not null,
  payment paymentmethod not null,
  city text not null,
  ward text not null,
  province text not null,
  phone_number text not null,
  detail_address text not null,
  created_at timestamp(3) default current_timestamp,
  editted_at timestamp(3),
  user_id text not null references users(user_id)
);

create table order_product (
  discount float,
  price float not null,
  quantity integer not null,
  order_id text references orders(order_id),
  product_id text references product(product_id)
);

create table slide_show (
  slide_id text primary key,
  url text not null,
  alt text not null,
  store_id text not null references store(store_id)
);
