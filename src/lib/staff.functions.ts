import { createMiddleware, createServerFn } from '@tanstack/react-start'
import { getUser, type User } from '@netlify/identity'
import { asc, desc } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '../../db'
import { books } from '../../db/schema'

/** Papéis do Netlify Identity que dão acesso à área da equipe (/gestao). */
const STAFF_ROLES = ['bibliotecario', 'admin']

const isStaff = (user: User) =>
  (user.roles ?? []).some((r) => STAFF_ROLES.includes(r))

/** Sessão atual: null sem login; `staff: false` para contas sem papel de equipe. */
export const getStaffSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const user = await getUser()
    if (!user) return null
    return {
      email: user.email ?? '',
      name: user.name ?? '',
      staff: isStaff(user),
    }
  },
)

const requireStaff = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const user = await getUser()
    if (!user || !isStaff(user))
      throw new Error('Acesso restrito à equipe da biblioteca.')
    return next({ context: { user } })
  },
)

/** Últimos livros cadastrados e gêneros já usados no acervo (para sugestões). */
export const getDeskData = createServerFn({ method: 'GET' })
  .middleware([requireStaff])
  .handler(async () => {
    const recent = db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        genre: books.genre,
        year: books.year,
        copies: books.copies,
        coverColor: books.coverColor,
        createdAt: books.createdAt,
      })
      .from(books)
      .orderBy(desc(books.createdAt), desc(books.id))
      .limit(10)
    const genres = db
      .selectDistinct({ genre: books.genre })
      .from(books)
      .orderBy(asc(books.genre))
    const [rows, genreRows] = await Promise.all([recent, genres])
    return {
      recent: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      genres: genreRows.map((g) => g.genre),
    }
  })

const currentYear = new Date().getFullYear()

export const bookInput = z.object({
  title: z.string().trim().min(1, 'Informe o título').max(200),
  author: z.string().trim().min(2, 'Informe o autor').max(160),
  genre: z.string().trim().min(2, 'Informe o gênero').max(80),
  year: z.coerce
    .number<string | number>({ error: 'Informe o ano' })
    .int('Use um ano inteiro')
    .min(1000, 'Ano inválido')
    .max(currentYear + 1, 'Ano inválido'),
  pages: z.coerce
    .number<string | number>({ error: 'Informe o número de páginas' })
    .int('Use um número inteiro')
    .min(1, 'Mínimo de 1 página')
    .max(20000, 'Número de páginas inválido'),
  copies: z.coerce
    .number<string | number>({ error: 'Informe os exemplares' })
    .int('Use um número inteiro')
    .min(1, 'Mínimo de 1 exemplar')
    .max(500, 'Máximo de 500 exemplares'),
  synopsis: z
    .string()
    .trim()
    .min(10, 'Escreva uma sinopse curta (mín. 10 caracteres)')
    .max(2000),
  coverColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida'),
})

export const createBook = createServerFn({ method: 'POST' })
  .middleware([requireStaff])
  .validator(bookInput)
  .handler(async ({ data }) => {
    const [book] = await db
      .insert(books)
      .values({ ...data, coverColor: data.coverColor.toLowerCase() })
      .returning({ id: books.id, title: books.title })
    return book
  })
