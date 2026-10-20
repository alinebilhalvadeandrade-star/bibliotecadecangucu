import { useState } from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { ArrowLeft, BookOpen, CalendarDays, Copy, Tag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BookCover } from '@/components/book-cover'
import { AvailabilityBadge } from '@/components/availability-badge'
import { ReserveDialog } from '@/components/reserve-dialog'
import { formatDate, relativeDays } from '@/lib/format'
import { getBook } from '@/lib/library.functions'

export const Route = createFileRoute('/livro/$bookId')({
  loader: async ({ params }) => {
    const book = await getBook({ data: { id: Number(params.bookId) } })
    if (!book) throw notFound()
    return book
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [{ title: `${loaderData.title} — Biblioteca Municipal Clóvis Rocha Moreira` }, { name: 'description', content: loaderData.synopsis }]
      : [],
  }),
  pendingComponent: () => (
    <div className="mx-auto grid max-w-content gap-10 px-4 py-12 sm:px-6 md:grid-cols-[16rem_1fr]">
      <Skeleton className="aspect-[2/3] w-full" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  ),
  component: BookPage,
})

function BookPage() {
  const book = Route.useLoaderData()
  const [open, setOpen] = useState(false)
  const canReserve = book.available > 0

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
      <Button variant="ghost" size="sm" asChild className="-ml-3 mb-6">
        <Link to="/">
          <ArrowLeft /> Voltar ao acervo
        </Link>
      </Button>

      <div className="grid gap-10 md:grid-cols-[16rem_1fr] md:gap-14">
        <BookCover title={book.title} author={book.author} color={book.coverColor} size="lg" className="mx-auto md:mx-0" />

        <div className="max-w-reading">
          <AvailabilityBadge book={book} />
          <h1 className="mt-3 text-4xl leading-tight font-semibold md:text-5xl">{book.title}</h1>
          <p className="mt-2 text-xl text-muted-foreground">{book.author}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl border bg-card p-5 sm:grid-cols-4">
            <Fact icon={<Tag />} label="Gênero" value={book.genre} />
            <Fact icon={<CalendarDays />} label="Publicação" value={String(book.year)} />
            <Fact icon={<BookOpen />} label="Páginas" value={String(book.pages)} />
            <Fact icon={<Copy />} label="Exemplares" value={String(book.copies)} />
          </dl>

          <p className="mt-6 text-lg leading-relaxed">{book.synopsis}</p>

          <div className="mt-8 rounded-xl border bg-secondary/50 p-5">
            <h2 className="text-lg font-semibold">Situação dos exemplares</h2>
            <ul className="mt-3 grid gap-1 text-sm">
              <li>
                <strong className="text-success">{book.available}</strong> disponíve{book.available === 1 ? 'l' : 'is'} para reserva
              </li>
              <li>
                <strong className="text-accent">{book.borrowed}</strong> emprestado{book.borrowed === 1 ? '' : 's'}
                {book.nextReturn && (
                  <span className="text-muted-foreground">
                    {' '}
                    — próxima devolução prevista para {formatDate(book.nextReturn)} ({relativeDays(book.nextReturn)})
                  </span>
                )}
              </li>
              <li>
                <strong>{book.reserved}</strong> aguardando retirada no balcão
              </li>
            </ul>
            <Button className="mt-5" size="lg" disabled={!canReserve} onClick={() => setOpen(true)}>
              {canReserve ? 'Reservar este livro' : 'Todos os exemplares ocupados'}
            </Button>
          </div>
        </div>
      </div>

      <ReserveDialog book={book} open={open} onOpenChange={setOpen} />
    </div>
  )
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground [&_svg]:size-3.5">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  )
}
