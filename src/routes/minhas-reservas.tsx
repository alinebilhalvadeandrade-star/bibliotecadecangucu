import { useEffect, useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { Inbox, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { BookCover } from '@/components/book-cover'
import { cn } from '@/lib/utils'
import { formatDate, relativeDays } from '@/lib/format'
import { cancelReservation, getMyLoans, type MyLoan } from '@/lib/library.functions'

export const Route = createFileRoute('/minhas-reservas')({
  head: () => ({ meta: [{ title: 'Minhas reservas — Biblioteca Municipal Clóvis Rocha Moreira' }] }),
  component: MyReservationsPage,
})

const READER_KEY = 'biblioteca:leitor'

const statusStyle: Record<string, { label: string; className: string }> = {
  reservado: { label: 'Reservado', className: 'bg-warning/20 text-[oklch(0.45_0.1_70)]' },
  emprestado: { label: 'Emprestado', className: 'bg-accent/12 text-accent' },
  devolvido: { label: 'Devolvido', className: 'bg-success/12 text-success' },
  cancelado: { label: 'Cancelado', className: 'bg-muted text-muted-foreground' },
  expirado: { label: 'Expirado', className: 'bg-muted text-muted-foreground' },
}

function MyReservationsPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loans, setLoans] = useState<MyLoan[] | null>(null)
  const [lookedUp, setLookedUp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<number | null>(null)

  async function lookup(address: string) {
    setLoading(true)
    setError(null)
    try {
      setLoans(await getMyLoans({ data: { email: address } }))
      setLookedUp(address.trim().toLowerCase())
    } catch {
      setError('Informe um e-mail válido.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(READER_KEY) ?? 'null')
      if (saved?.email) {
        setEmail(saved.email)
        void lookup(saved.email)
      }
    } catch {
      // ignora dados salvos inválidos
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function cancel(loan: MyLoan) {
    setCancelling(loan.id)
    try {
      const result = await cancelReservation({ data: { id: loan.id, email: lookedUp } })
      if (!result.ok) {
        toast.error(result.error)
      } else {
        toast.success(`Reserva de “${loan.title}” cancelada.`)
      }
      await Promise.all([lookup(lookedUp), router.invalidate()])
    } catch {
      toast.error('Não foi possível cancelar agora. Tente novamente.')
    } finally {
      setCancelling(null)
    }
  }

  const active = loans?.filter((l) => l.status === 'reservado' || l.status === 'emprestado') ?? []
  const history = loans?.filter((l) => l.status !== 'reservado' && l.status !== 'emprestado') ?? []

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-semibold">Minhas reservas</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Consulte seus livros reservados e emprestados usando o e-mail informado na reserva.
      </p>

      <form
        className="mt-8 flex flex-col gap-3 rounded-xl border bg-card p-5 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault()
          void lookup(email)
        }}
      >
        <div className="grid flex-1 gap-2">
          <Label htmlFor="lookup-email">E-mail</Label>
          <Input
            id="lookup-email"
            type="email"
            required
            autoComplete="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Search />}
          Consultar
        </Button>
      </form>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading && !loans && (
        <div className="mt-8 space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {loans && loans.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center">
          <Inbox className="size-8 text-muted-foreground" aria-hidden />
          <p className="font-medium">Nenhuma reserva encontrada para {lookedUp}.</p>
          <Button asChild variant="outline">
            <Link to="/">Explorar o acervo</Link>
          </Button>
        </div>
      )}

      {loans && loans.length > 0 && (
        <>
          <section className="mt-10" aria-labelledby="ativas-title">
            <h2 id="ativas-title" className="text-2xl font-semibold">
              Ativas ({active.length})
            </h2>
            {active.length === 0 ? (
              <p className="mt-3 text-muted-foreground">Você não tem reservas ou empréstimos ativos.</p>
            ) : (
              <ul className="mt-4 divide-y rounded-xl border bg-card">
                {active.map((l) => (
                  <LoanItem key={l.id} loan={l}>
                    {l.status === 'reservado' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={cancelling === l.id}
                        onClick={() => void cancel(l)}
                      >
                        {cancelling === l.id && <Loader2 className="animate-spin motion-reduce:animate-none" />}
                        Cancelar
                      </Button>
                    )}
                  </LoanItem>
                ))}
              </ul>
            )}
          </section>

          {history.length > 0 && (
            <section className="mt-10" aria-labelledby="historico-title">
              <h2 id="historico-title" className="text-2xl font-semibold">
                Histórico
              </h2>
              <ul className="mt-4 divide-y rounded-xl border bg-card">
                {history.map((l) => (
                  <LoanItem key={l.id} loan={l} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function LoanItem({ loan, children }: { loan: MyLoan; children?: React.ReactNode }) {
  const style = statusStyle[loan.status] ?? statusStyle.cancelado
  const detail =
    loan.status === 'reservado' && loan.expiresAt
      ? `Retire até ${formatDate(loan.expiresAt)} (${relativeDays(loan.expiresAt)})`
      : loan.status === 'emprestado' && loan.dueAt
        ? `Devolver até ${formatDate(loan.dueAt)} (${relativeDays(loan.dueAt)})`
        : loan.status === 'devolvido' && loan.returnedAt
          ? `Devolvido em ${formatDate(loan.returnedAt)}`
          : `Reservado em ${formatDate(loan.createdAt)}`

  return (
    <li className="flex items-center gap-4 p-4">
      <BookCover title={loan.title} author={loan.author} color={loan.coverColor} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/livro/$bookId"
            params={{ bookId: String(loan.bookId) }}
            className="font-semibold hover:underline"
          >
            {loan.title}
          </Link>
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', style.className)}>
            {style.label}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
      {children}
    </li>
  )
}
