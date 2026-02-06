CREATE TYPE "public"."publication_type" AS ENUM('ResearchPaper', 'Thesis', 'Journal', 'Other');--> statement-breakpoint
CREATE TABLE "publication_authors" (
	"publication_id" text NOT NULL,
	"author_id" text NOT NULL,
	CONSTRAINT "publication_authors_publication_id_author_id_pk" PRIMARY KEY("publication_id","author_id")
);
--> statement-breakpoint
CREATE TABLE "publications" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"title" text NOT NULL,
	"abstract" text,
	"date_published" text,
	"type" "publication_type" NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "question_papers" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"title" text NOT NULL,
	"module_id" integer NOT NULL,
	"term_id" integer NOT NULL,
	"assessment_type" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DROP TABLE "library_resources" CASCADE;--> statement-breakpoint
ALTER TABLE "publication_authors" ADD CONSTRAINT "publication_authors_publication_id_publications_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_authors" ADD CONSTRAINT "publication_authors_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publications" ADD CONSTRAINT "publications_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_papers" ADD CONSTRAINT "question_papers_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_papers" ADD CONSTRAINT "question_papers_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_papers" ADD CONSTRAINT "question_papers_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_publications_title_trgm" ON "publications" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_publications_type" ON "publications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "fk_publications_document" ON "publications" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_question_papers_title_trgm" ON "question_papers" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "fk_question_papers_module" ON "question_papers" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "fk_question_papers_term" ON "question_papers" USING btree ("term_id");--> statement-breakpoint
CREATE INDEX "fk_question_papers_document" ON "question_papers" USING btree ("document_id");--> statement-breakpoint
DROP TYPE "public"."resource_type";