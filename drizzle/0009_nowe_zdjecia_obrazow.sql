-- Nowe, przycięte zdjęcia obrazów Koi Light Art jako główne; dotychczasowe zostają jako drugie.
-- Dopisujemy na początek listy, więc zdjęcia dodane w panelu też zostają.
UPDATE "offers" SET "photos" = array_prepend('/img/obrazy/asagi-2.jpg', array_remove("photos", '/img/obrazy/asagi-2.jpg')) WHERE "id" = 'obraz-asagi';--> statement-breakpoint
UPDATE "offers" SET "photos" = array_prepend('/img/obrazy/showa-wsrod-fal-2.jpg', array_remove("photos", '/img/obrazy/showa-wsrod-fal-2.jpg')) WHERE "id" = 'obraz-showa-wsrod-fal';--> statement-breakpoint
UPDATE "offers" SET "photos" = array_prepend('/img/obrazy/butterfly-2.jpg', array_remove("photos", '/img/obrazy/butterfly-2.jpg')) WHERE "id" = 'obraz-butterfly';
