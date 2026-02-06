-- Drop foreign key constraints
ALTER TABLE "book_authors" DROP CONSTRAINT IF EXISTS "book_authors_author_id_authors_id_fk";--> statement-breakpoint
ALTER TABLE "book_authors" DROP CONSTRAINT IF EXISTS "book_authors_book_id_books_id_fk";--> statement-breakpoint
ALTER TABLE "book_categories" DROP CONSTRAINT IF EXISTS "book_categories_book_id_books_id_fk";--> statement-breakpoint
ALTER TABLE "book_categories" DROP CONSTRAINT IF EXISTS "book_categories_category_id_categories_id_fk";--> statement-breakpoint
ALTER TABLE "book_copies" DROP CONSTRAINT IF EXISTS "book_copies_book_id_books_id_fk";--> statement-breakpoint
ALTER TABLE "fines" DROP CONSTRAINT IF EXISTS "fines_loan_id_loans_id_fk";--> statement-breakpoint
ALTER TABLE "loan_renewals" DROP CONSTRAINT IF EXISTS "loan_renewals_loan_id_loans_id_fk";--> statement-breakpoint
ALTER TABLE "loans" DROP CONSTRAINT IF EXISTS "loans_book_copy_id_book_copies_id_fk";--> statement-breakpoint

-- Alter column types
ALTER TABLE "authors" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "books" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "book_copies" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "book_copies" ALTER COLUMN "book_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "book_authors" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "book_authors" ALTER COLUMN "book_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "book_authors" ALTER COLUMN "author_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "book_categories" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "book_categories" ALTER COLUMN "book_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "book_categories" ALTER COLUMN "category_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "external_libraries" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "fines" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "fines" ALTER COLUMN "loan_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "loan_renewals" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "loan_renewals" ALTER COLUMN "loan_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "book_copy_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "library_resources" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint

-- Drop defaults
ALTER TABLE "authors" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "books" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "book_copies" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "book_authors" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "book_categories" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "fines" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "loan_renewals" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "library_resources" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint

-- Re-add foreign key constraints
ALTER TABLE "book_authors" ADD CONSTRAINT "book_authors_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_authors" ADD CONSTRAINT "book_authors_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_categories" ADD CONSTRAINT "book_categories_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_categories" ADD CONSTRAINT "book_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fines" ADD CONSTRAINT "fines_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_renewals" ADD CONSTRAINT "loan_renewals_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_book_copy_id_book_copies_id_fk" FOREIGN KEY ("book_copy_id") REFERENCES "public"."book_copies"("id") ON DELETE cascade ON UPDATE no action;
