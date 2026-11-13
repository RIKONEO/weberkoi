ALTER TABLE "enquiries" ADD COLUMN "basket" text;--> statement-breakpoint
CREATE INDEX "enquiries_basket_idx" ON "enquiries" USING btree ("basket");