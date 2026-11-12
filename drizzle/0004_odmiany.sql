CREATE TABLE "varieties" (
	"name" text PRIMARY KEY NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
-- Dotychczasowa stała lista z kodu i odmiany użyte już w ofertach.
INSERT INTO "varieties" ("name", "position") VALUES
	('Kohaku', 1), ('Taisho Sanke', 2), ('Showa Sanshoku', 3), ('Tancho', 4), ('Ogon', 5), ('Chagoi', 6), ('Asagi', 7)
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "varieties" ("name", "position")
SELECT DISTINCT "variety", 100 FROM "offers"
ON CONFLICT DO NOTHING;
