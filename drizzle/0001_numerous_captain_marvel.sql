ALTER TABLE "InvoiceProduct" ADD COLUMN "productCode" text;--> statement-breakpoint
ALTER TABLE "InvoiceProduct" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "InvoiceProduct" ADD COLUMN "storage" text;--> statement-breakpoint
ALTER TABLE "InvoiceProduct" DROP COLUMN IF EXISTS "createdAt";--> statement-breakpoint
ALTER TABLE "InvoiceProduct" DROP COLUMN IF EXISTS "updateAt";