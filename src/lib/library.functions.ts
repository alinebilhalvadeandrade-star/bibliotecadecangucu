import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, gt, inArray, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '../../db'
import { books, loans } from '../../db/schema'

/** Dias que uma reserva fica guardada no balcão aguardando retirada. */
export const RESERVATION_HOLD_DAYS = 3

// Um exemplar está ocupado quando está emprestado ou com reserva ainda válida.
const activeLoan = or(
  eq(loans.status, 'emprestado'),
  and(eq(loans.status, 'reservado'), gt(loans.expiresAt, sql`now()`)),
)

const activityColumns = {
  borrowed: sql<number>`count(*) filter (where ${loans.status} = 'emprestado')`.mapWith(Number),
  reserved: sql<number>`count(*) filter (where ${loans.status} = 'reservado')`.mapWith(Number),
  nextReturn: sql<Date | null>`min(${loans.dueAt})`.mapWith(loans.dueAt),
}

async function activityByBook(bookIds?: number[]) {
  const rows = await db
    .select({ bookId: loans.bookId, ...activityColumns })
    .from(loans)
    .where(bookIds ? and(activeLoan, inArray(loans.bookId, bookIds)) : activeLoan)
    .groupBy(loans.bookId)
  return new Map(rows.map((r) => [r.bookId, r]))
}

function withAvailability<T extends { id: number; copies: number }>(
  book: T,
  activity: Map<number, { borrowed: number; reserved: number; nextReturn: Date | null }>,
) {
  const a = activity.get(book.id)
  const borrowed = a?.borrowed ?? 0
  const reserved = a?.reserved ?? 0
  const available = Math.max(0, book.copies - borrowed - reserved)
  return {
    ...book,
    borrowed,
    reserved,
    available,
    nextReturn: a?.nextReturn ? new Date(a.nextReturn).toISOString() : null,
  }
}

const bookColumns = {
  id: books.id,
  title: books.title,
  author: books.author,
  genre: books.genre,
  year: books.year,
  pages: books.pages,
  synopsis: books.synopsis,
  copies: books.copies,
  coverColor: books.coverColor,
}

export type CatalogBook = Awaited<ReturnType<typeof getCatalog>>[number]

export const getCatalog = createServerFn({ method: 'GET' }).handler(async () => {
  const [rows, activity] = await Promise.all([
    db.select(bookColumns).from(books).orderBy(asc(books.title)),
    activityByBook(),
  ])
  return rows.map((b) => withAvailability(b, activity))
})

export const getBook = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.coerce.number().int().positive() }))
  .handler(async ({ data }) => {
    const [row] = await db.select(bookColumns).from(books).where(eq(books.id, data.id))
    if (!row) return null
    return withAvailability(row, await activityByBook([row.id]))
  })

/** Primeiro nome + inicial do sobrenome, para não expor dados de outros leitores. */
function shortName(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0]
}

export const getBorrowed = createServerFn({ method: 'GET' }).handler(async () => {
  const rows = await db
    .select({
      id: loans.id,
      status: loans.status,
      borrowerName: loans.borrowerName,
      createdAt: loans.createdAt,
      dueAt: loans.dueAt,
      expiresAt: loans.expiresAt,
      bookId: books.id,
      title: books.title,
      author: books.author,
      genre: books.genre,
      coverColor: books.coverColor,
    })
    .from(loans)
    .innerJoin(books, eq(loans.bookId, books.id))
    .where(activeLoan)
    .orderBy(asc(sql`coalesce(${loans.dueAt}, ${loans.expiresAt})`))

  return rows.map(({ borrowerName, ...r }) => ({
    ...r,
    reader: shortName(borrowerName),
    createdAt: r.createdAt.toISOString(),
    dueAt: r.dueAt?.toISOString() ?? null,
    expiresAt: r.expiresAt?.toISOString() ?? null,
  }))
})

const email = z.string().trim().toLowerCase().email('Informe um e-mail válido').max(200)

export const reserveBook = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      bookId: z.number().int().positive(),
      name: z.string().trim().min(2, 'Informe seu nome').max(120),
      email,
    }),
  )
  .handler(async ({ data }) => {
    const [book] = await db
      .select({ id: books.id, copies: books.copies })
      .from(books)
      .where(eq(books.id, data.bookId))
    if (!book) return { ok: false as const, error: 'Livro não encontrado.' }

    const [existing] = await db
      .select({ id: loans.id })
      .from(loans)
      .where(and(activeLoan, eq(loans.bookId, book.id), eq(loans.borrowerEmail, data.email)))
    if (existing) {
      return { ok: false as const, error: 'Você já tem uma reserva ou empréstimo ativo deste livro.' }
    }

    const { available } = withAvailability(book, await activityByBook([book.id]))
    if (available <= 0) {
      return { ok: false as const, error: 'Todos os exemplares estão ocupados no momento.' }
    }

    const expiresAt = new Date(Date.now() + RESERVATION_HOLD_DAYS * 24 * 60 * 60 * 1000)
    const [loan] = await db
      .insert(loans)
      .values({
        bookId: book.id,
        borrowerName: data.name,
        borrowerEmail: data.email,
        status: 'reservado',
        expiresAt,
      })
      .returning({ id: loans.id })

    return { ok: true as const, id: loan.id, expiresAt: expiresAt.toISOString() }
  })

export type MyLoan = Awaited<ReturnType<typeof getMyLoans>>[number]

export const getMyLoans = createServerFn({ method: 'POST' })
  .validator(z.object({ email }))
  .handler(async ({ data }) => {
    const rows = await db
      .select({
        id: loans.id,
        status: loans.status,
        createdAt: loans.createdAt,
        dueAt: loans.dueAt,
        expiresAt: loans.expiresAt,
        returnedAt: loans.returnedAt,
        bookId: books.id,
        title: books.title,
        author: books.author,
        coverColor: books.coverColor,
      })
      .from(loans)
      .innerJoin(books, eq(loans.bookId, books.id))
      .where(eq(loans.borrowerEmail, data.email))
      .orderBy(desc(loans.createdAt))
      .limit(50)

    const now = Date.now()
    return rows.map((r) => ({
      ...r,
      // Reservas não retiradas no prazo aparecem como expiradas.
      status:
        r.status === 'reservado' && r.expiresAt && r.expiresAt.getTime() <= now
          ? 'expirado'
          : r.status,
      createdAt: r.createdAt.toISOString(),
      dueAt: r.dueAt?.toISOString() ?? null,
      expiresAt: r.expiresAt?.toISOString() ?? null,
      returnedAt: r.returnedAt?.toISOString() ?? null,
    }))
  })

export const cancelReservation = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.number().int().positive(), email }))
  .handler(async ({ data }) => {
    const updated = await db
      .update(loans)
      .set({ status: 'cancelado' })
      .where(
        and(
          eq(loans.id, data.id),
          eq(loans.borrowerEmail, data.email),
          eq(loans.status, 'reservado'),
        ),
      )
      .returning({ id: loans.id })
    if (updated.length === 0) {
      return { ok: false as const, error: 'Reserva não encontrada ou já finalizada.' }
    }
    return { ok: true as const }
  })
