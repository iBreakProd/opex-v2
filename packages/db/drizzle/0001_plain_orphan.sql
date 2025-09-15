CREATE TYPE "public"."order_type" AS ENUM('short', 'long');--> statement-breakpoint
CREATE TABLE "existing_trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"open_price" integer NOT NULL,
	"leverage" integer NOT NULL,
	"asset" varchar(255) NOT NULL,
	"margin" integer NOT NULL,
	"quantity" double precision NOT NULL,
	"type" "order_type" NOT NULL,
	"close_price" integer NOT NULL,
	"pnl" integer NOT NULL,
	"decimal" integer NOT NULL,
	"liquidated" boolean NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"balance" integer NOT NULL,
	"decimal" integer DEFAULT 4 NOT NULL,
	"last_logged_in" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DROP TABLE "ExistingTrades" CASCADE;--> statement-breakpoint
DROP TABLE "Users" CASCADE;--> statement-breakpoint
ALTER TABLE "existing_trades" ADD CONSTRAINT "existing_trades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
DROP TYPE "public"."OrderType";