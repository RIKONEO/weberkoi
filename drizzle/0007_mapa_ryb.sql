CREATE TABLE "fish_maps" (
	"offer_id" text PRIMARY KEY NOT NULL,
	"mime" text NOT NULL,
	"data" "bytea" NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"markers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "fish_no" integer;--> statement-breakpoint
ALTER TABLE "fish_maps" ADD CONSTRAINT "fish_maps_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "enquiries_fish_no_taken_idx" ON "enquiries" USING btree ("offer_id","fish_no") WHERE "enquiries"."fish_no" is not null and "enquiries"."fish" in ('zarezerwowana', 'sprzedana');