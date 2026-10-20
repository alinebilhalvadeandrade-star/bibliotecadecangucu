import { Link, createFileRoute } from '@tanstack/react-router'
import { BookCheck, Clock, Hourglass } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { BookCover } from '@/components/book-cover'
import { cn } from '@/lib/utils'
import { formatDate, relativeDays } from '@/lib/format'
import { getBorrowed } from '@/lib/library.functions'

export const Route = createFileRoute('/emprestados')({
  loader: () => getBorrowed(),
  head: () => ({ meta: [{ title: 'Emprestados — Biblioteca Municipal Clóvis Rocha Moreira' }] }),
  pendingComponent: () => (
    <div className="mx-auto max-w-content space-y-3 px-4 py-12 sm:px-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  ),
  component: BorrowedPage,
})

type Row = Awaited<ReturnType<typeof getBorrowed>>[number]

function BorrowedPage() {
  const rows = Route.useLoaderData()
  const borrowed = rows.filter((r) => r.status === 'emprestado')
  const reserved = rows.filter((r) => r.status === 'reservado')

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
      <header className="max-w-reading">
        <h1 className="text-4xl font-semibold">Livros emprestados</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Veja quais títulos estão fora da estante agora e quando devem voltar.
        </p>
      </header>

      <section aria-labelledby="emprestados-title" className="mt-10">
        <h2 id="emprestados-title" className="flex items-center gap-2 text-2xl font-semibold">
          <BookCheck className="size-5 text-accent" aria-hidden />
          Com leitores ({borrowed.length})
        </h2>
        {borrowed.length === 0 ? (
          <Empty>Nenhum livro emprestado no momento — toda a estante está disponível.</Empty>
        ) : (
          <ul className="mt-4 divide-y rounded-xl border bg-card">
            {borrowed.map((r) => (
              <LoanRow key={r.id} row={r} when={r.dueAt} whenLabel="Devolução" />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="reservados-title" className="mt-12">
        <h2 id="reservados-title" className="flex items-center gap-2 text-2xl font-semibold">
          <Hourglass className="size-5 text-warning" aria-hidden />
          Aguardando retirada ({reserved.length})
        </h2>
        {reserved.length === 0 ? (
          <Empty>Nenhuma reserva aguardando retirada.</Empty>
        ) : (
          <ul className="mt-4 divide-y rounded-xl border bg-card">
            {reserved.map((r) => (
              <LoanRow key={r.id} row={r} when={r.expiresAt} whenLabel="Retirar até" />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function LoanRow({ row, when, whenLabel }: { row: Row; when: string | null; whenLabel: string }) {
  const soon = when ? new Date(when).getTime() - Date.now() < 3 * 86_400_000 : false
  return (
    <li className="flex items-center gap-4 p-4">
      <BookCover title={row.title} author={row.author} color={row.coverColor} size="sm" />
      <div className="min-w-0 flex-1">
        <Link
          to="/livro/$bookId"
          params={{ bookId: String(row.bookId) }}
          className="font-semibold hover:underline"
        >
          {row.title}
        </Link>
        <p className="truncate text-sm text-muted-foreground">
          {row.author} · com {row.reader}
        </p>
      </div>
      {when && (
        <div className="text-right text-sm">
          <p className="text-xs text-muted-foreground">{whenLabel}</p>
          <p className={cn('flex items-center justify-end gap-1 font-semibold', soon && 'text-accent')}>
            <Clock className="size-3.5" aria-hidden />
            {formatDate(when)}
          </p>
          <p className="text-xs text-muted-foreground">{relativeDays(when)}</p>
        </div>
      )}
    </li>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-xl border border-dashed p-8 text-center text-muted-foreground">
      {children}
    </p>
  )
}
