DO $$ BEGIN
 CREATE TYPE "public"."invoiceStatus" AS ENUM('NEW', 'SHIPPING', 'DONE', 'ABORT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."paymentMethod" AS ENUM('COD', 'BANKING');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."userRoles" AS ENUM('ADMIN', 'CLIENT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "AttributeOption" (
	"optionID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"optionValue" text NOT NULL,
	"typeID" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "AttributeType" (
	"typeID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"typeValue" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Category" (
	"categoryID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"categoryName" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "InvoiceProduct" (
	"discount" real,
	"price" real NOT NULL,
	"productName" text NOT NULL,
	"quantity" smallint NOT NULL,
	"invoiceID " uuid,
	"productID" uuid,
	"createdAt" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updateAt" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Invoice" (
	"invoiceID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "invoiceStatus" NOT NULL,
	"payment" "paymentMethod" NOT NULL,
	"city" text NOT NULL,
	"ward" text NOT NULL,
	"province" text NOT NULL,
	"phoneNumber" text NOT NULL,
	"detailAddress" text NOT NULL,
	"userID" uuid NOT NULL,
	"createdAt" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ItemImage" (
	"imageID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"itemID" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ProductAttribute" (
	"productID" uuid NOT NULL,
	"optionID" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ProductItem" (
	"itemID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thump" text NOT NULL,
	"quantity" smallint NOT NULL,
	"price" real NOT NULL,
	"productCode" text,
	"discount" real DEFAULT 0,
	"color" text NOT NULL,
	"storage" text,
	"productID" uuid,
	CONSTRAINT "ProductItem_productCode_unique" UNIQUE("productCode")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Product" (
	"productID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"productName" varchar(255) NOT NULL,
	"description" text,
	"length" real NOT NULL,
	"width" real NOT NULL,
	"height" real NOT NULL,
	"weight" real NOT NULL,
	"warranty" real NOT NULL,
	"caregoryID" uuid,
	"providerID" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Provider" (
	"providerID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"providerName" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Review" (
	"reviewID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reviewContent" text NOT NULL,
	"rating" smallint DEFAULT 5,
	"productID" uuid NOT NULL,
	"userID" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "SlideShow" (
	"slideID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"alt" text NOT NULL,
	"storeID" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Store" (
	"storeID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storeName" varchar(255) NOT NULL,
	"description" text,
	"address" text,
	"phoneNumber" varchar(10),
	"email" varchar(255),
	"bannerUrls" text[]
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "User" (
	"userID" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userName" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"phoneNumber" varchar(10),
	"avatar" text,
	"isBanned" boolean DEFAULT false NOT NULL,
	"role" "userRoles" DEFAULT 'CLIENT' NOT NULL,
	"refreshTokenUsed" text[],
	"createdAt" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updateAt" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AttributeOption" ADD CONSTRAINT "AttributeOption_typeID_AttributeType_typeID_fk" FOREIGN KEY ("typeID") REFERENCES "public"."AttributeType"("typeID") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "InvoiceProduct" ADD CONSTRAINT "InvoiceProduct_invoiceID _Invoice_invoiceID_fk" FOREIGN KEY ("invoiceID ") REFERENCES "public"."Invoice"("invoiceID") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "InvoiceProduct" ADD CONSTRAINT "InvoiceProduct_productID_Product_productID_fk" FOREIGN KEY ("productID") REFERENCES "public"."Product"("productID") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userID_User_userID_fk" FOREIGN KEY ("userID") REFERENCES "public"."User"("userID") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ItemImage" ADD CONSTRAINT "ItemImage_itemID_ProductItem_itemID_fk" FOREIGN KEY ("itemID") REFERENCES "public"."ProductItem"("itemID") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_productID_Product_productID_fk" FOREIGN KEY ("productID") REFERENCES "public"."Product"("productID") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_optionID_AttributeOption_optionID_fk" FOREIGN KEY ("optionID") REFERENCES "public"."AttributeOption"("optionID") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ProductItem" ADD CONSTRAINT "ProductItem_productID_Product_productID_fk" FOREIGN KEY ("productID") REFERENCES "public"."Product"("productID") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Product" ADD CONSTRAINT "Product_caregoryID_Category_categoryID_fk" FOREIGN KEY ("caregoryID") REFERENCES "public"."Category"("categoryID") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Product" ADD CONSTRAINT "Product_providerID_Provider_providerID_fk" FOREIGN KEY ("providerID") REFERENCES "public"."Provider"("providerID") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Review" ADD CONSTRAINT "Review_productID_Product_productID_fk" FOREIGN KEY ("productID") REFERENCES "public"."Product"("productID") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Review" ADD CONSTRAINT "Review_userID_User_userID_fk" FOREIGN KEY ("userID") REFERENCES "public"."User"("userID") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "SlideShow" ADD CONSTRAINT "SlideShow_storeID_Store_storeID_fk" FOREIGN KEY ("storeID") REFERENCES "public"."Store"("storeID") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
