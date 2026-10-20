import { cn } from '@/lib/utils'
import { relativeDays } from '@/lib/format'
import type { CatalogBook } from '@/lib/library.functions'

export type Availability = 'disponivel' | 'emprestado' | 'reservado'

export function availabilityOf(book: Pick<CatalogBook, 'available' | 'borrowed'>): Availability {
  if (book.available > 0) return 'disponivel'
  return book.borrowed > 0 ? 'emprestado' : 'reservado'
}

export function AvailabilityBadge({
  book,
  className,
}: {
  book: Pick<CatalogBook, 'available' | 'borrowed' | 'copies' | 'nextReturn'>
  className?: string
}) {
  const status = availabilityOf(book)
  const label =
    status === 'disponivel'
      ? `Disponível · ${book.available}/${book.copies}`
      : status === 'emprestado'
        ? book.nextReturn
          ? `Emprestado · volta ${relativeDays(book.nextReturn)}`
          : 'Emprestado'
        : 'Reservado'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        status === 'disponivel' && 'bg-success/12 text-success',
        status === 'emprestado' && 'bg-accent/12 text-accent',
        status === 'reservado' && 'bg-warning/20 text-[oklch(0.45_0.1_70)]',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-1.5 rounded-full',
          status === 'disponivel' && 'bg-success',
          status === 'emprestado' && 'bg-accent',
          status === 'reservado' && 'bg-warning',
        )}
      />
      {label}
    </span>
  )
}
