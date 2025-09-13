CREATE TYPE "public"."OrderType" AS ENUM('short', 'long');--> statement-breakpoint
CREATE TABLE "ExistingTrades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"openPrice" integer NOT NULL,
	"leverage" integer NOT NULL,
	"asset" varchar(255) NOT NULL,
	"margin" integer NOT NULL,
	"quantity" double precision NOT NULL,
	"type" "OrderType" NOT NULL,
	"closePrice" integer NOT NULL,
	"pnl" integer NOT NULL,
	"decimal" integer NOT NULL,
	"liquidated" boolean NOT NULL,
	"userId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"balance" integer NOT NULL,
	"decimal" integer DEFAULT 4 NOT NULL,
	"lastLoggedInt" timestamp,
	CONSTRAINT "Users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ExistingTrades" ADD CONSTRAINT "ExistingTrades_userId_Users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE no action ON UPDATE no action;