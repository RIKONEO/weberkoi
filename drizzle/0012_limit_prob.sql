CREATE TABLE "rate_hits" (
	"id" serial PRIMARY KEY NOT NULL,
	"bucket" text NOT NULL,
	"key" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "rate_hits_bucket_key_at" ON "rate_hits" USING btree ("bucket","key","at");