CREATE TYPE "public"."book_condition" AS ENUM('New', 'Good', 'Damaged');--> statement-breakpoint
CREATE TYPE "public"."book_copy_status" AS ENUM('Available', 'OnLoan', 'Withdrawn');--> statement-breakpoint
CREATE TYPE "public"."fine_status" AS ENUM('Unpaid', 'Paid');--> statement-breakpoint
CREATE TYPE "public"."loan_status" AS ENUM('Active', 'Returned', 'Overdue');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('PastPaper', 'ResearchPaper', 'Thesis', 'Journal', 'Other');--> statement-breakpoint
CREATE TABLE "authors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "book_copies" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"serial_number" text NOT NULL,
	"condition" "book_condition" DEFAULT 'Good' NOT NULL,
	"status" "book_copy_status" DEFAULT 'Available' NOT NULL,
	"location" text,
	"acquired_at" date,
	CONSTRAINT "book_copies_serialNumber_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "book_authors" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	CONSTRAINT "book_author_unique" UNIQUE("book_id","author_id")
);
--> statement-breakpoint
CREATE TABLE "book_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	CONSTRAINT "book_category_unique" UNIQUE("book_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" serial PRIMARY KEY NOT NULL,
	"isbn" text NOT NULL,
	"title" text NOT NULL,
	"publisher" text,
	"publication_year" integer,
	"edition" text,
	"cover_url" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "books_isbn_unique" UNIQUE("isbn")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "external_libraries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"username" text,
	"password" text,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fines" (
	"id" serial PRIMARY KEY NOT NULL,
	"loan_id" integer NOT NULL,
	"std_no" bigint NOT NULL,
	"amount" real NOT NULL,
	"days_overdue" integer NOT NULL,
	"status" "fine_status" DEFAULT 'Unpaid' NOT NULL,
	"receipt_id" text,
	"created_at" timestamp DEFAULT now(),
	"paid_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "loan_renewals" (
	"id" serial PRIMARY KEY NOT NULL,
	"loan_id" integer NOT NULL,
	"previous_due_date" timestamp NOT NULL,
	"new_due_date" timestamp NOT NULL,
	"renewed_by" text,
	"renewed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_copy_id" integer NOT NULL,
	"std_no" bigint NOT NULL,
	"loan_date" timestamp DEFAULT now() NOT NULL,
	"due_date" timestamp NOT NULL,
	"return_date" timestamp,
	"status" "loan_status" DEFAULT 'Active' NOT NULL,
	"issued_by" text,
	"returned_to" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "digital_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" "resource_type" NOT NULL,
	"file_name" text NOT NULL,
	"original_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"is_downloadable" boolean DEFAULT true NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "student_module_audit_logs" ADD COLUMN "student_module_cms_id" integer;--> statement-breakpoint
ALTER TABLE "student_program_audit_logs" ADD COLUMN "student_program_cms_id" integer;--> statement-breakpoint
ALTER TABLE "student_semester_audit_logs" ADD COLUMN "student_semester_cms_id" integer;--> statement-breakpoint
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_authors" ADD CONSTRAINT "book_authors_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_authors" ADD CONSTRAINT "book_authors_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_categories" ADD CONSTRAINT "book_categories_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_categories" ADD CONSTRAINT "book_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fines" ADD CONSTRAINT "fines_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fines" ADD CONSTRAINT "fines_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fines" ADD CONSTRAINT "fines_receipt_id_payment_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."payment_receipts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_renewals" ADD CONSTRAINT "loan_renewals_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_renewals" ADD CONSTRAINT "loan_renewals_renewed_by_users_id_fk" FOREIGN KEY ("renewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_book_copy_id_book_copies_id_fk" FOREIGN KEY ("book_copy_id") REFERENCES "public"."book_copies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_returned_to_users_id_fk" FOREIGN KEY ("returned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_resources" ADD CONSTRAINT "digital_resources_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_authors_name_trgm" ON "authors" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_book_copies_book_id" ON "book_copies" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "idx_book_copies_status" ON "book_copies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_book_copies_serial_number" ON "book_copies" USING btree ("serial_number");--> statement-breakpoint
CREATE INDEX "idx_books_title_trgm" ON "books" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_books_isbn" ON "books" USING btree ("isbn");--> statement-breakpoint
CREATE INDEX "idx_fines_loan_id" ON "fines" USING btree ("loan_id");--> statement-breakpoint
CREATE INDEX "idx_fines_std_no" ON "fines" USING btree ("std_no");--> statement-breakpoint
CREATE INDEX "idx_fines_status" ON "fines" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_fines_receipt_id" ON "fines" USING btree ("receipt_id");--> statement-breakpoint
CREATE INDEX "idx_loan_renewals_loan_id" ON "loan_renewals" USING btree ("loan_id");--> statement-breakpoint
CREATE INDEX "idx_loans_book_copy_id" ON "loans" USING btree ("book_copy_id");--> statement-breakpoint
CREATE INDEX "idx_loans_std_no" ON "loans" USING btree ("std_no");--> statement-breakpoint
CREATE INDEX "idx_loans_status" ON "loans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_loans_due_date" ON "loans" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_loans_std_no_status" ON "loans" USING btree ("std_no","status");--> statement-breakpoint
CREATE INDEX "idx_digital_resources_title_trgm" ON "digital_resources" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_digital_resources_type" ON "digital_resources" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_digital_resources_uploaded_by" ON "digital_resources" USING btree ("uploaded_by");