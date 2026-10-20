import { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { CalendarClock, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookCover } from '@/components/book-cover'
import { formatDate } from '@/lib/format'
import { reserveBook, type CatalogBook } from '@/lib/library.functions'

const READER_KEY = 'biblioteca:leitor'

export function ReserveDialog({
  book,
  open,
  onOpenChange,
}: {
  book: CatalogBook | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [confirmed, setConfirmed] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setConfirmed(null)
    try {
      const saved = JSON.parse(localStorage.getItem(READER_KEY) ?? 'null')
      if (saved?.name) setName(saved.name)
      if (saved?.email) setEmail(saved.email)
    } catch {
      // ignora dados salvos inválidos
    }
  }, [open])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!book) return
    setPending(true)
    setError(null)
    try {
      const result = await reserveBook({ data: { bookId: book.id, name, email } })
      if (!result.ok) {
        setError(result.error)
        return
      }
      localStorage.setItem(READER_KEY, JSON.stringify({ name, email }))
      setConfirmed(result.expiresAt)
      toast.success(`“${book.title}” reservado!`)
      await router.invalidate()
    } catch {
      setError('Confira seu nome e e-mail e tente novamente.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {book && confirmed ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-success" aria-hidden />
                Reserva confirmada
              </DialogTitle>
              <DialogDescription>
                “{book.title}” está separado para você.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-start gap-3 rounded-lg border bg-secondary/60 p-4 text-sm">
              <CalendarClock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <p>
                Retire o livro no balcão até <strong>{formatDate(confirmed)}</strong>. Depois
                disso, a reserva expira e o exemplar volta para o acervo.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => router.navigate({ to: '/minhas-reservas' })}>
                Ver minhas reservas
              </Button>
              <Button onClick={() => onOpenChange(false)}>Continuar explorando</Button>
            </DialogFooter>
          </>
        ) : book ? (
          <form onSubmit={onSubmit} className="grid gap-5">
            <DialogHeader>
              <DialogTitle>Reservar livro</DialogTitle>
              <DialogDescription>
                Informe seus dados para separarmos um exemplar no balcão por 3 dias.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-4">
              <BookCover title={book.title} author={book.author} color={book.coverColor} size="sm" />
              <div>
                <p className="font-display text-lg leading-tight font-semibold">{book.title}</p>
                <p className="text-sm text-muted-foreground">{book.author}</p>
                <p className="mt-1 text-sm text-success">
                  {book.available} de {book.copies} exemplar{book.copies > 1 ? 'es' : ''} disponíve
                  {book.available === 1 ? 'l' : 'is'}
                </p>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reader-name">Nome completo</Label>
              <Input
                id="reader-name"
                autoComplete="name"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reader-email">E-mail</Label>
              <Input
                id="reader-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use o mesmo e-mail para consultar e cancelar suas reservas.
              </p>
            </div>
            {error && (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
                Confirmar reserva
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
