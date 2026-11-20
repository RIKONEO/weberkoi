CREATE TABLE "offer_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"offer_id" text,
	"mime" text NOT NULL,
	"data" "bytea" NOT NULL,
	"width" integer,
	"height" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "kind" text DEFAULT 'ryba' NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "dimensions" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "photos" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "offer_photos" ADD CONSTRAINT "offer_photos_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "offers" ("id", "kind", "variety", "title", "size_min", "size_max", "count", "price", "description", "photos", "published", "featured") VALUES
('obraz-asagi', 'obraz', '', 'Asagi', 0, 0, 1, NULL, 'Pojedynczy koi płynący w dół, z regularną siatką łusek na grzbiecie, po której poznaje się odmianę Asagi. Wzór jest wycięty laserem w czarnej stalowej płycie, a diody LED za obrazem podświetlają go od tyłu: po zmroku ryba świeci ciepłym światłem na tle ciemnej stali. Spokojny, minimalistyczny motyw do salonu, sypialni albo przedpokoju.', ARRAY['/img/obrazy/asagi.jpg'], true, false),
('obraz-showa-wsrod-fal', 'obraz', '', 'Showa wśród fal', 0, 0, 1, NULL, 'Duży koi w ciemne łaty, otoczony falami jak z japońskiego drzeworytu. Ciemne plamy na ciele przypominają sumi, czarny wzór odmiany Showa, choć można w nim zobaczyć też Kohaku albo Ochibę. To nasz najbardziej ażurowy wzór: światło LED przechodzi przez gęsto wycięte fale i łuski, a cała płyta jarzy się jak japoński lampion.', ARRAY['/img/obrazy/showa-wsrod-fal.jpg'], true, false),
('obraz-butterfly', 'obraz', '', 'Butterfly. Para koi', 0, 0, 1, NULL, 'Dwa koi krążące wokół siebie, z długimi, falującymi płetwami jak u koi Butterfly. Układ przypomina yin i yang: ruch, równowagę i parę, która płynie razem. Wycięty laserem w stali i podświetlany od tyłu diodami LED. Dobry pomysł na prezent, np. na ślub, rocznicę albo nowe mieszkanie.', ARRAY['/img/obrazy/butterfly.jpg'], true, false)
ON CONFLICT ("id") DO NOTHING;
