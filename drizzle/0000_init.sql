CREATE TABLE "enquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"offer_id" text NOT NULL,
	"qty" integer NOT NULL,
	"picks" integer[],
	"second" text DEFAULT '' NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'nowe' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" text PRIMARY KEY NOT NULL,
	"variety" text NOT NULL,
	"title" text NOT NULL,
	"breeder" text DEFAULT '' NOT NULL,
	"age" text DEFAULT '' NOT NULL,
	"size_min" integer NOT NULL,
	"size_max" integer NOT NULL,
	"count" integer NOT NULL,
	"sold" integer[] DEFAULT '{}' NOT NULL,
	"group_sold" integer DEFAULT 0 NOT NULL,
	"price" integer,
	"video_url" text,
	"poster_url" text,
	"video_length" text,
	"description" text DEFAULT '' NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"offer_id" text NOT NULL,
	"title" text NOT NULL,
	"qty" integer NOT NULL,
	"picks" integer[],
	"unit_price" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"no" text NOT NULL,
	"status" text DEFAULT 'nowe' NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"street" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"delivery" text NOT NULL,
	"day" date NOT NULL,
	"payment" text NOT NULL,
	"items_total" integer NOT NULL,
	"delivery_price" integer NOT NULL,
	"total" integer NOT NULL,
	"tracking_no" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_no_unique" UNIQUE("no")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE no action ON UPDATE no action;