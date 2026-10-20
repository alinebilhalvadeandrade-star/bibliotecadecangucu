import { Link } from '@tanstack/react-router'
import { BookMarked, Library, Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const nav = [
  { to: '/', label: 'Acervo' },
  { to: '/emprestados', label: 'Emprestados' },
  { to: '/minhas-reservas', label: 'Minhas reservas' },
] as const

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2 rounded-md">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
            <Library className="size-5" aria-hidden />
          </span>
          <span className="font-display text-base leading-tight font-semibold tracking-tight sm:text-xl">
            Biblioteca Municipal Clóvis Rocha Moreira
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: true }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground motion-reduce:transition-none data-[status=active]:bg-secondary data-[status=active]:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Biblioteca Municipal Clóvis Rocha Moreira</SheetTitle>
              <SheetDescription>Navegue pelo acervo e suas reservas.</SheetDescription>
            </SheetHeader>
            <nav aria-label="Menu móvel" className="flex flex-col gap-1 px-4">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: true }}
                  className="rounded-md px-3 py-2 font-medium hover:bg-secondary data-[status=active]:bg-secondary"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-secondary/50">
      <div className="mx-auto flex max-w-content flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2">
          <BookMarked className="size-4" aria-hidden />
          Biblioteca Municipal Clóvis Rocha Moreira — reservas ficam guardadas por 3 dias no balcão.
        </p>
        <p>Empréstimos de até 14 dias, renováveis no balcão.</p>
      </div>
    </footer>
  )
}
