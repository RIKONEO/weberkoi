CREATE TABLE "enquiry_screenshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"enquiry_id" integer NOT NULL,
	"mime" text NOT NULL,
	"data" bytea NOT NULL
);
--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "phone" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "enquiry_screenshots" ADD CONSTRAINT "enquiry_screenshots_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;