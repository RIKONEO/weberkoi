-- Dawne zgłoszenia dostają „wolna”, żeby nic starego nie pokazało się nagle pod filmikami;
-- dopiero nowe zgłoszenia są od razu „zarezerwowana”.
ALTER TABLE "enquiries" ADD COLUMN "fish" text DEFAULT 'wolna' NOT NULL;--> statement-breakpoint
ALTER TABLE "enquiries" ALTER COLUMN "fish" SET DEFAULT 'zarezerwowana';
