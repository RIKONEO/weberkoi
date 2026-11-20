-- Rikardo 2026-11-20: bez wstawki o prezencie na ślub / rocznicę.
UPDATE "offers" SET "description" = replace("description", ' Dobry pomysł na prezent, np. na ślub, rocznicę albo nowe mieszkanie.', '') WHERE "id" = 'obraz-butterfly';
