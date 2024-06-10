DO $$ BEGIN
 CREATE TYPE "public"."userRoles" AS ENUM('ADMIN', 'CLIENT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"publicKey" text NOT NULL,
	"privateKey" text NOT NULL,
	"refreshTokenUsed" text[],
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"phoneNumber" varchar(10),
	"avatar" text,
	"role" "userRoles" DEFAULT 'CLIENT' NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "keys" ADD CONSTRAINT "keys_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
