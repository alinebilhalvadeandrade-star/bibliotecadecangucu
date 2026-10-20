CREATE TABLE "books" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"genre" text NOT NULL,
	"year" integer NOT NULL,
	"pages" integer NOT NULL,
	"synopsis" text NOT NULL,
	"copies" integer DEFAULT 1 NOT NULL,
	"cover_color" text DEFAULT '#2f4a3a' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" serial PRIMARY KEY,
	"book_id" integer NOT NULL,
	"borrower_name" text NOT NULL,
	"borrower_email" text NOT NULL,
	"status" text DEFAULT 'reservado' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"due_at" timestamp,
	"returned_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "loans_book_idx" ON "loans" ("book_id");--> statement-breakpoint
CREATE INDEX "loans_email_idx" ON "loans" ("borrower_email");--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_book_id_books_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id");