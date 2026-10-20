import { useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { BookOpen, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { BookCover } from '@/components/book-cover'
import { AvailabilityBadge, availabilityOf, type Availability } from '@/components/availability-badge'
import { ReserveDialog } from '@/components/reserve-dialog'
import { cn } from '@/lib/utils'
import { getCatalog, type CatalogBook } from '@/lib/library.functions'

export const Route = createFileRoute('/')({
  loader: () => getCatalog(),
  pendingComponent: CatalogSkeleton,
  component: Home,
})

const statusFilters: { value: Availability | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'disponivel', label: 'Disponíveis' },
  { value: 'emprestado', label: 'Emprestados' },
  { value: 'reservado', label: 'Reservados' },
]

function normalize(s: string) {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

function Home() {
  const books = Route.useLoaderData()
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState<string>('todos')
  const [status, setStatus] = useState<Availability | 'todos'>('todos')
  const [selected, setSelected] = useState<CatalogBook | null>(null)

  const genres = useMemo(() => [...new Set(books.map((b) => b.genre))].sort(), [books])

  const totals = useMemo(
    () =>
      books.reduce(
        (acc, b) => ({
          copies: acc.copies + b.copies,
          available: acc.available + b.available,
          borrowed: acc.borrowed + b.borrowed,
        }),
        { copies: 0, available: 0, borrowed: 0 },
      ),
    [books],
  )

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    return books.filter(
      (b) =>
        (genre === 'todos' || b.genre === genre) &&
        (status === 'todos' || availabilityOf(b) === status) &&
        (!q || normalize(`${b.title} ${b.author}`).includes(q)),
    )
  }, [books, query, genre, status])

  const hasFilters = query || genre !== 'todos' || status !== 'todos'

  return (
    <>
      <section className="relative overflow-hidden border-b">
        <img
          src="/.netlify/images?url=/img/biblioteca.jpg&w=1600&fm=webp"
          srcSet="/.netlify/images?url=/img/biblioteca.jpg&w=800&fm=webp 800w, /.netlify/images?url=/img/biblioteca.jpg&w=1600&fm=webp 1600w"
          sizes="100vw"
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.2_0.04_155/0.92)] via-[oklch(0.2_0.04_155/0.7)] to-transparent" />
        <div className="relative mx-auto max-w-content px-4 py-16 sm:px-6 md:py-24">
          <div className="max-w-xl text-[oklch(0.97_0.015_85)]">
            <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-[oklch(0.82_0.12_75)] uppercase">
              Acervo online
            </p>
            <h1 className="text-4xl leading-[1.05] font-semibold text-balance md:text-6xl">
              Encontre seu próximo livro e reserve em segundos.
            </h1>
            <p className="mt-5 text-lg opacity-90">
              Consulte todo o acervo, veja na hora o que está disponível ou emprestado e
              garanta seu exemplar para retirar no balcão.
            </p>
            <dl className="mt-8 grid max-w-md grid-cols-3 gap-4 border-t border-white/20 pt-6">
              <Stat label="Títulos" value={books.length} />
              <Stat label="Disponíveis" value={totals.available} />
              <Stat label="Emprestados" value={totals.borrowed} />
            </dl>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-content px-4 py-12 sm:px-6" aria-labelledby="acervo-title">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 id="acervo-title" className="text-3xl font-semibold">
                Acervo
              </h2>
              <p className="text-muted-foreground">
                {filtered.length} de {books.length} títulos
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                placeholder="Buscar por título ou autor"
                aria-label="Buscar por título ou autor"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-card pl-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <FilterRow label="Situação">
              {statusFilters.map((f) => (
                <Chip key={f.value} active={status === f.value} onClick={() => setStatus(f.value)}>
                  {f.label}
                </Chip>
              ))}
            </FilterRow>
            <FilterRow label="Gênero">
              <Chip active={genre === 'todos'} onClick={() => setGenre('todos')}>
                Todos
              </Chip>
              {genres.map((g) => (
                <Chip key={g} active={genre === g} onClick={() => setGenre(g)}>
                  {g}
                </Chip>
              ))}
            </FilterRow>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
              <BookOpen className="size-8 text-muted-foreground" aria-hidden />
              <p className="font-medium">Nenhum livro encontrado com esses filtros.</p>
              {hasFilters && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery('')
                    setGenre('todos')
                    setStatus('todos')
                  }}
                >
                  <X /> Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filtered.map((book) => (
                <li key={book.id}>
                  <BookCard book={book} onReserve={() => setSelected(book)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <ReserveDialog
        book={selected}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs tracking-wide uppercase opacity-75">{label}</dt>
      <dd className="font-display text-3xl font-semibold">{value}</dd>
    </div>
  )
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="w-20 text-sm font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'bg-card text-foreground hover:bg-secondary',
      )}
    >
      {children}
    </button>
  )
}

function BookCard({ book, onReserve }: { book: CatalogBook; onReserve: () => void }) {
  const canReserve = book.available > 0
  return (
    <article className="group flex h-full flex-col gap-3">
      <Link
        to="/livro/$bookId"
        params={{ bookId: String(book.id) }}
        className="block rounded-md transition-transform outline-none group-hover:-translate-y-1 focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none"
      >
        <BookCover title={book.title} author={book.author} color={book.coverColor} />
        <span className="sr-only">Ver detalhes de {book.title}</span>
      </Link>
      <div className="flex flex-1 flex-col gap-1.5">
        <AvailabilityBadge book={book} />
        <h3 className="leading-snug font-semibold">
          <Link to="/livro/$bookId" params={{ bookId: String(book.id) }} className="hover:underline">
            {book.title}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">
          {book.author} · {book.year}
        </p>
      </div>
      <Button
        size="sm"
        variant={canReserve ? 'default' : 'outline'}
        disabled={!canReserve}
        onClick={onReserve}
        aria-label={canReserve ? `Reservar ${book.title}` : `${book.title} indisponível`}
      >
        {canReserve ? 'Reservar' : 'Indisponível'}
      </Button>
    </article>
  )
}

function CatalogSkeleton() {
  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
      <Skeleton className="mb-8 h-64 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[2/3] w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}
