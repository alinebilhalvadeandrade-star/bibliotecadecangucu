import { integer, pgTable, serial, text, timestamp, index } from 'drizzle-orm/pg-core'

export const books = pgTable('books', {
  id: serial().primaryKey(),
  title: text().notNull(),
  author: text().notNull(),
  genre: text().notNull(),
  year: integer().notNull(),
  pages: integer().notNull(),
  synopsis: text().notNull(),
  copies: integer().notNull().default(1),
  coverColor: text('cover_color').notNull().default('#2f4a3a'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// status: 'reservado' (aguardando retirada até expires_at), 'emprestado' (até due_at),
// 'devolvido' ou 'cancelado'.
export const loans = pgTable(
  'loans',
  {
    id: serial().primaryKey(),
    bookId: integer('book_id')
      .notNull()
      .references(() => books.id),
    borrowerName: text('borrower_name').notNull(),
    borrowerEmail: text('borrower_email').notNull(),
    status: text().notNull().default('reservado'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at'),
    dueAt: timestamp('due_at'),
    returnedAt: timestamp('returned_at'),
  },
  (t) => [index('loans_book_idx').on(t.bookId), index('loans_email_idx').on(t.borrowerEmail)],
)

export type Book = typeof books.$inferSelect
export type Loan = typeof loans.$inferSelect
