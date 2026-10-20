import { useState } from 'react'
import {
  Link,
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { logout } from '@netlify/identity'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { BookPlus, Loader2, LogOut, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { BookCover } from '@/components/book-cover'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import {
  bookInput,
  createBook,
  getDeskData,
  getStaffSession,
} from '@/lib/staff.functions'

export const Route = createFileRoute('/gestao/')({
  head: () => ({
    meta: [
      {
        title: 'Cadastro de livros — Biblioteca Municipal Clóvis Rocha Moreira',
      },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  beforeLoad: async () => {
    const session = await getStaffSession()
    if (!session) throw redirect({ to: '/gestao/entrar' })
    return { session }
  },
  loader: async ({ context }) => (context.session.staff ? getDeskData() : null),
  component: BookDeskPage,
})

type BookFormInput = z.input<typeof bookInput>
type BookFormOutput = z.output<typeof bookInput>

const COVER_COLORS = [
  '#2f4a3a',
  '#7a3b2e',
  '#b5832a',
  '#c46a3c',
  '#1f3b5c',
  '#5b3a6b',
  '#3d5a5b',
  '#8c2f39',
  '#e8d9b5',
  '#2a2a24',
]

const emptyBook: BookFormInput = {
  title: '',
  author: '',
  genre: '',
  year: '',
  pages: '',
  copies: 1,
  synopsis: '',
  coverColor: COVER_COLORS[0],
}

function BookDeskPage() {
  const { session } = Route.useRouteContext()
  const data = Route.useLoaderData()
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)

  async function signOut() {
    setLeaving(true)
    try {
      await logout()
    } finally {
      await router.invalidate()
      setLeaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-accent uppercase">
            Área da equipe
          </p>
          <h1 className="mt-1 text-4xl font-semibold">Cadastro de livros</h1>
          <p className="mt-2 max-w-reading text-lg text-muted-foreground">
            Inclua títulos no acervo manualmente. Eles aparecem no catálogo
            assim que salvos.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="hidden sm:inline">
            {session.name || session.email}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void signOut()}
            disabled={leaving}
          >
            {leaving ? (
              <Loader2 className="animate-spin motion-reduce:animate-none" />
            ) : (
              <LogOut />
            )}
            Sair
          </Button>
        </div>
      </div>

      {!data ? (
        <div className="mt-10 flex max-w-reading flex-col items-start gap-3 rounded-xl border border-dashed p-8">
          <ShieldAlert className="size-8 text-destructive" aria-hidden />
          <h2 className="text-xl font-semibold">Acesso não liberado</h2>
          <p className="text-muted-foreground">
            A conta {session.email} ainda não tem permissão de bibliotecário.
            Peça à administração para atribuir o papel “bibliotecario” à sua
            conta.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <BookForm genres={data.genres} onSaved={() => router.invalidate()} />

          <aside aria-labelledby="recentes-title">
            <h2 id="recentes-title" className="text-xl font-semibold">
              Cadastrados recentemente
            </h2>
            {data.recent.length === 0 ? (
              <p className="mt-3 text-muted-foreground">
                Nenhum livro no acervo ainda.
              </p>
            ) : (
              <ul className="mt-4 divide-y rounded-xl border bg-card">
                {data.recent.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 p-3">
                    <BookCover
                      title={b.title}
                      author={b.author}
                      color={b.coverColor}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/livro/$bookId"
                        params={{ bookId: String(b.id) }}
                        className="line-clamp-1 font-semibold hover:underline"
                      >
                        {b.title}
                      </Link>
                      <p className="line-clamp-1 text-sm text-muted-foreground">
                        {b.author}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {b.copies} {b.copies === 1 ? 'exemplar' : 'exemplares'}{' '}
                        · {formatDate(b.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}

function BookForm({
  genres,
  onSaved,
}: {
  genres: string[]
  onSaved: () => Promise<void>
}) {
  const form = useForm<BookFormInput, unknown, BookFormOutput>({
    resolver: zodResolver(bookInput),
    defaultValues: emptyBook,
  })
  const [title, author, coverColor] = useWatch({
    control: form.control,
    name: ['title', 'author', 'coverColor'],
  })

  const submit = form.handleSubmit(async (values) => {
    form.clearErrors('root')
    try {
      const book = await createBook({ data: values })
      toast.success(`“${book.title}” foi incluído no acervo.`)
      form.reset({ ...emptyBook, genre: values.genre })
      await onSaved()
    } catch {
      form.setError('root', {
        message:
          'Não foi possível salvar o livro. Verifique se sua sessão ainda está ativa e tente novamente.',
      })
    }
  })

  return (
    <Form {...form}>
      <form
        onSubmit={submit}
        noValidate
        className="rounded-xl border bg-card p-6"
      >
        <fieldset
          disabled={form.formState.isSubmitting}
          className="grid gap-6 md:grid-cols-[1fr_9rem]"
        >
          <legend className="sr-only">Dados do livro</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Autor(a)</FormLabel>
                  <FormControl>
                    <Input required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="genre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gênero</FormLabel>
                  <FormControl>
                    <Input list="generos" required {...field} />
                  </FormControl>
                  <datalist id="generos">
                    {genres.map((g) => (
                      <option key={g} value={g} />
                    ))}
                  </datalist>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4 sm:col-span-2">
              {(
                [
                  ['year', 'Ano'],
                  ['pages', 'Páginas'],
                  ['copies', 'Exemplares'],
                ] as const
              ).map(([name, label]) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          required
                          {...field}
                          value={field.value as string | number}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <FormField
              control={form.control}
              name="synopsis"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Sinopse</FormLabel>
                  <FormControl>
                    <Textarea rows={5} required {...field} />
                  </FormControl>
                  <FormDescription>
                    Aparece na página do livro para os leitores.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="coverColor"
            render={({ field }) => (
              <FormItem className="content-start">
                <FormLabel>Cor da capa</FormLabel>
                <BookCover
                  title={title || 'Título do livro'}
                  author={author || 'Autor'}
                  color={coverColor}
                  className="max-w-36"
                />
                <div
                  className="mt-2 flex flex-wrap gap-1.5"
                  role="radiogroup"
                  aria-label="Cores sugeridas"
                >
                  {COVER_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={field.value === c}
                      aria-label={`Cor ${c}`}
                      onClick={() => field.onChange(c)}
                      className={cn(
                        'size-6 rounded-full border ring-offset-2 ring-offset-card transition-shadow motion-reduce:transition-none',
                        field.value === c && 'ring-2 ring-ring',
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <FormControl>
                  <Input
                    type="color"
                    className="mt-1 h-9 w-full cursor-pointer p-1"
                    aria-label="Escolher outra cor"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-3 md:col-span-2">
            {form.formState.errors.root && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
            <Button type="submit" className="self-start">
              {form.formState.isSubmitting ? (
                <Loader2 className="animate-spin motion-reduce:animate-none" />
              ) : (
                <BookPlus />
              )}
              {form.formState.isSubmitting ? 'Salvando…' : 'Cadastrar livro'}
            </Button>
          </div>
        </fieldset>
      </form>
    </Form>
  )
}
