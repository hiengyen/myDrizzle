DO $$ BEGIN
 CREATE TYPE "public"."invoiceStatus" AS ENUM('new', 'shipping', 'done', 'abort');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."paymentMethod" AS ENUM('cod', 'banking');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."userRoles" AS ENUM('admin', 'client');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attributeOption" (
	"id" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"typeID" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attributeType" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"value" text NOT NULL,
	"createdAt" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updateAt" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"createdAt" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updateAt" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoiceProduct" (
	"discount" real,
	"price" real NOT NULL,
	"productName" text NOT NULL,
	"quantity" smallint NOT NULL,
	"invoiceID " text,
	"productID" text,
	"createdAt" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updateAt" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"status" "invoiceStatus" NOT NULL,
	"payment" "paymentMethod" NOT NULL,
	"city" text NOT NULL,
	"ward" text NOT NULL,
	"province" text NOT NULL,
	"phoneNumber" text NOT NULL,
	"detailAddress" text NOT NULL,
	"userID" text NOT NULL,
	"createdAt" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updateAt" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "itemImage" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"itemID" text NOT NULL,
	"createdAt" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updateAt" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "productItems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thumpnail" text NOT NULL,
	"quantity" smallint NOT NULL,
	"price" real NOT NULL,
	"productCode" text,
	"discount" real DEFAULT 0,
	"coulour" text NOT NULL,
	"storage" text,
	"productID" uuid,
	"createdAt" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updateAt" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "productItems_productCode_unique" UNIQUE("productCode")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"length" real NOT NULL,
	"width" real NOT NULL,
	"height" real NOT NULL,
	"weight" real NOT NULL,
	"waranty" real NOT NULL,
	"caregoryID" uuid,
	"providerID" uuid,
	"createdAt" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updateAt" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"createdAt" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updateAt" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "review" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"rating" smallint DEFAULT 5,
	"productID" text NOT NULL,
	"userID" text NOT NULL,
	"createdAt" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updateAt" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "slideShow" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"alt" text NOT NULL,
	"storeID" text NOT NULL,
	"createdAt" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updateAt" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"address" text,
	"phoneNumber" varchar(10),
	"email" varchar(255),
	"bannerUrls" text[],
	"createdAt" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updateAt" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"phoneNumber" varchar(10),
	"avatar" text,
	"role" "userRoles" DEFAULT 'client' NOT NULL,
	"refreshTokenUsed" text[],
	"createdAt" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updateAt" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attributeOption" ADD CONSTRAINT "attributeOption_typeID_attributeType_id_fk" FOREIGN KEY ("typeID") REFERENCES "public"."attributeType"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoiceProduct" ADD CONSTRAINT "invoiceProduct_invoiceID _invoices_id_fk" FOREIGN KEY ("invoiceID ") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoiceProduct" ADD CONSTRAINT "invoiceProduct_productID_products_id_fk" FOREIGN KEY ("productID") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_userID_users_id_fk" FOREIGN KEY ("userID") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "itemImage" ADD CONSTRAINT "itemImage_itemID_productItems_id_fk" FOREIGN KEY ("itemID") REFERENCES "public"."productItems"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "productItems" ADD CONSTRAINT "productItems_productID_products_id_fk" FOREIGN KEY ("productID") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_caregoryID_categories_id_fk" FOREIGN KEY ("caregoryID") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_providerID_providers_id_fk" FOREIGN KEY ("providerID") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "review" ADD CONSTRAINT "review_productID_products_id_fk" FOREIGN KEY ("productID") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "review" ADD CONSTRAINT "review_userID_users_id_fk" FOREIGN KEY ("userID") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "slideShow" ADD CONSTRAINT "slideShow_storeID_stores_id_fk" FOREIGN KEY ("storeID") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
